import test from "node:test";
import assert from "node:assert/strict";
import { extractTaskKeys, syncTasksFromGitHubPush } from "../src/services/commitTaskSync.js";

test("extractTaskKeys returns normalized unique keys", () => {
  const keys = extractTaskKeys("task-123 fixes login and TASK-123 adds tests; ABC-9");
  assert.deepEqual(keys, ["TASK-123", "ABC-9"]);
});

test("syncTasksFromGitHubPush creates comments and marks done", async () => {
  const tasks = [
    {
      id: "t1",
      _id: "t1",
      board_id: "b1",
      title: "TASK-123 Implement login validation",
      description: "",
      task_key: "TASK-123",
      status: "in_progress",
      save: async function save() {
        return this;
      },
    },
  ];
  const comments = [];
  const boards = [{ _id: "b1", workspace_id: "w1" }];
  const workspaces = [{ _id: "w1", owner_id: "u1" }];

  const models = {
    Task: {
      find: async (query) => {
        if (query?._id?.$in) return tasks.filter((task) => query._id.$in.includes(task._id));
        if (!query?.$or) return tasks;
        return tasks.filter((task) =>
          query.$or.some((condition) => {
            if (condition.task_key?.$in) return condition.task_key.$in.includes(task.task_key);
            if (condition.title?.$regex) return condition.title.$regex.test(task.title);
            if (condition.description?.$regex) return condition.description.$regex.test(task.description);
            return false;
          })
        );
      },
    },
    Comment: {
      create: async (comment) => {
        comments.push(comment);
        return comment;
      },
    },
    Board: {
      find: async (query) => boards.filter((board) => query._id.$in.includes(board._id)),
    },
    Workspace: {
      find: async (query) => workspaces.filter((ws) => query._id.$in.includes(ws._id)),
    },
  };

  const payload = {
    sender: { avatar_url: "https://example.com/avatar.png" },
    commits: [
      {
        id: "abcdef123456",
        message: "TASK-123: Implement login validation",
        url: "https://github.com/org/repo/commit/abcdef123456",
        author: { name: "Alice" },
      },
    ],
  };

  const result = await syncTasksFromGitHubPush({
    payload,
    models,
    webhookAutoMarkDone: true,
  });

  assert.equal(comments.length, 1);
  assert.equal(comments[0].task_id, "t1");
  assert.equal(comments[0].source, "github_commit");
  assert.equal(tasks[0].status, "done");
  assert.deepEqual(result.touchedTaskIds, ["t1"]);
  assert.deepEqual(result.ownerIds, ["u1"]);
  assert.equal(result.updatedStatuses, 1);
});
