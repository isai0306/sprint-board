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

export async function syncTasksFromGitHubPush({
  payload,
  models,
  webhookAutoMarkDone = false,
}) {
  const commits = Array.isArray(payload?.commits) ? payload.commits : [];
  if (!commits.length) {
    return { touchedTaskIds: [], ownerIds: [], updatedComments: 0, updatedStatuses: 0 };
  }

  const touchedTaskIds = new Set();
  let updatedComments = 0;
  let updatedStatuses = 0;

  for (const commit of commits) {
    const keys = extractTaskKeys(commit.message);
    if (!keys.length) continue;

    const regexes = keys.map((key) => new RegExp(`\\b${escapeRegex(key)}\\b`, "i"));
    const tasks = await models.Task.find({
      $or: [
        { task_key: { $in: keys } },
        ...regexes.map((pattern) => ({ title: { $regex: pattern } })),
        ...regexes.map((pattern) => ({ description: { $regex: pattern } })),
      ],
    });

    if (!tasks.length) continue;

    for (const task of tasks) {
      touchedTaskIds.add(task.id);
      await models.Comment.create({
        task_id: task.id,
        content: buildCommitCommentContent(commit),
        user_id: "system",
        source: "github_commit",
        author_name: commit.author?.name || commit.author?.username || "GitHub",
        author_avatar_url: payload?.sender?.avatar_url || "",
        commit_sha: String(commit.id || ""),
        commit_url: String(commit.url || ""),
      });
      updatedComments += 1;

      if (webhookAutoMarkDone && task.status !== "done") {
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
  };
}
