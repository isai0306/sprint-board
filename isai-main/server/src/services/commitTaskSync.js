function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractTaskKeys(message) {
  if (!message) return [];
  const matches = String(message).match(/\b([a-z][a-z0-9]+-\d+)\b/gi) || [];
  return [...new Set(matches.map((key) => key.toUpperCase()))];
}

function normalizeTaskKeyFromText(text) {
  const keys = extractTaskKeys(text);
  return keys[0] || "";
}

export function buildCommitCommentContent(commit) {
  const shortSha = String(commit.id || "").slice(0, 7);
  const title = String(commit.message || "").split("\n")[0].trim();
  const author = commit.author?.name || commit.author?.username || "Unknown author";
  const link = commit.url ? `\n${commit.url}` : "";
  return `Commit ${shortSha} by ${author}: ${title}${link}`.trim();
}

function shouldMarkTaskDone(message, webhookAutoMarkDone) {
  return Boolean(webhookAutoMarkDone) || /(^|\s)#done(\s|$)/i.test(String(message || ""));
}

function commitTimestamp(commit) {
  const raw = commit?.timestamp || commit?.author?.date || null;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function syncTasksFromGitHubPush({
  payload,
  models,
  boardId,
  webhookAutoMarkDone = false,
}) {
  const commits = Array.isArray(payload?.commits) ? payload.commits : [];
  if (!commits.length) {
    return {
      touchedTaskIds: [],
      ownerIds: [],
      updatedComments: 0,
      updatedStatuses: 0,
      developerStats: [],
    };
  }

  const touchedTaskIds = new Set();
  const developerStatsMap = new Map();
  let updatedComments = 0;
  let updatedStatuses = 0;

  for (const commit of commits) {
    const authorName = commit.author?.name || commit.author?.username || "GitHub";
    const authorEmail = String(commit.author?.email || "").trim().toLowerCase();
    const authorKey = authorEmail || String(authorName).trim().toLowerCase() || "unknown";
    if (!developerStatsMap.has(authorKey)) {
      developerStatsMap.set(authorKey, {
        author_key: authorKey,
        author_name: authorName,
        author_email: authorEmail,
        author_avatar_url: payload?.sender?.avatar_url || "",
        commit_count: 0,
        task_ids: new Set(),
        last_activity_at: null,
      });
    }
    const devStats = developerStatsMap.get(authorKey);
    devStats.commit_count += 1;
    const timestamp = commitTimestamp(commit);
    if (timestamp && (!devStats.last_activity_at || timestamp > devStats.last_activity_at)) {
      devStats.last_activity_at = timestamp;
    }

    const keys = extractTaskKeys(commit.message);
    if (!keys.length) continue;
    const doneRequested = shouldMarkTaskDone(commit.message, webhookAutoMarkDone);

    const regexes = keys.map((key) => new RegExp(`\\b${escapeRegex(key)}\\b`, "i"));
    const taskQuery = {
      $or: [
        { task_key: { $in: keys } },
        ...regexes.map((pattern) => ({ title: { $regex: pattern } })),
        ...regexes.map((pattern) => ({ description: { $regex: pattern } })),
      ],
    };
    if (boardId) {
      taskQuery.board_id = boardId;
    }
    const tasks = await models.Task.find(taskQuery);

    if (!tasks.length) continue;

    for (const task of tasks) {
      touchedTaskIds.add(task.id);
      devStats.task_ids.add(task.id);
      await models.Comment.create({
        task_id: task.id,
        content: buildCommitCommentContent(commit),
        user_id: "system",
        source: "github_commit",
        author_name: authorName,
        author_email: authorEmail,
        author_avatar_url: payload?.sender?.avatar_url || "",
        commit_sha: String(commit.id || ""),
        commit_url: String(commit.url || ""),
        commit_timestamp: timestamp,
      });
      updatedComments += 1;

      if (doneRequested && task.status !== "done") {
        task.status = "done";
        await task.save();
        updatedStatuses += 1;
      }

      if (!task.task_key) {
        const inferred = normalizeTaskKeyFromText(task.title) || normalizeTaskKeyFromText(task.description);
        if (inferred) {
          task.task_key = inferred;
          await task.save();
        }
      }
    }
  }

  const touchedTasks = touchedTaskIds.size
    ? await models.Task.find({ _id: { $in: [...touchedTaskIds] } })
    : [];
  const boardIds = [...new Set(touchedTasks.map((task) => task.board_id).filter(Boolean))];
  const boards = boardIds.length
    ? await models.Board.find({ _id: { $in: boardIds } })
    : [];
  const workspaceIds = [...new Set(boards.map((board) => board.workspace_id).filter(Boolean))];
  const workspaces = workspaceIds.length
    ? await models.Workspace.find({ _id: { $in: workspaceIds } })
    : [];
  const ownerIds = [...new Set(workspaces.map((ws) => ws.owner_id).filter(Boolean))];

  return {
    touchedTaskIds: [...touchedTaskIds],
    ownerIds,
    updatedComments,
    updatedStatuses,
    developerStats: [...developerStatsMap.values()].map((item) => ({
      author_key: item.author_key,
      author_name: item.author_name,
      author_email: item.author_email,
      author_avatar_url: item.author_avatar_url,
      commit_count: item.commit_count,
      task_ids: [...item.task_ids],
      last_activity_at: item.last_activity_at,
    })),
  };
}
