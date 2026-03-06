import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authRequired, signAuthToken } from "../middleware/auth.js";
import passport from "../oauth/passport.js";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { Invitation } from "../models/Invitation.js";
import { Workspace } from "../models/Workspace.js";
import { Board } from "../models/Board.js";
import { Task } from "../models/Task.js";
import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import { sendInvitationEmail } from "../services/mailer.js";

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeReturnUrl(candidate) {
  if (!candidate) return config.clientUrl;
  try {
    const url = new URL(candidate);
    if (config.clientUrls.includes(url.origin)) return `${url.origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    // ignore malformed return URL
  }
  return config.clientUrl;
}

function encodeState(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeState(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url || "",
    role: user.role || "",
    bio: user.bio || "",
    location: user.location || "",
    timezone: user.timezone || "",
    phone: user.phone || "",
    company: user.company || "",
    website: user.website || "",
  };
}

async function acceptPendingInvitesForEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return;
  await Invitation.updateMany(
    {
      email: normalized,
      status: "pending",
      expires_at: { $gt: new Date() },
    },
    {
      $set: {
        status: "accepted",
        accepted_at: new Date(),
      },
    }
  );
}

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.post("/auth/signup", async (req, res) => {
  const { email, password, username, inviteToken } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ message: "email, password and username are required" });
  }
  if (!emailPattern.test(String(email).trim().toLowerCase())) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    username: username.trim(),
  });

  if (inviteToken && typeof inviteToken === "string") {
    const invite = await Invitation.findOne({
      token: inviteToken,
      email: email.toLowerCase(),
      status: "pending",
      expires_at: { $gt: new Date() },
    });
    if (invite) {
      invite.status = "accepted";
      invite.accepted_at = new Date();
      await invite.save();
    }
  }

  await acceptPendingInvitesForEmail(user.email);

  const token = signAuthToken(user);
  return res.status(201).json({ token, user: publicUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }
  if (!emailPattern.test(String(email).trim().toLowerCase())) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signAuthToken(user);
  await acceptPendingInvitesForEmail(user.email);
  return res.json({ token, user: publicUser(user) });
});

router.post("/auth/forgot-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: "email and newPassword are required" });
  }
  if (!emailPattern.test(String(email).trim().toLowerCase())) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: "No account found for this email" });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  return res.json({ ok: true });
});

router.post("/auth/social-login", async (req, res) => {
  const { provider } = req.body;
  if (!provider || !["google", "github"].includes(provider)) {
    return res.status(400).json({ message: "provider must be google or github" });
  }

  const email = `${provider}.demo@isai.local`;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      passwordHash: await bcrypt.hash(`${provider}-oauth-demo`, 10),
      username: provider === "google" ? "Google User" : "GitHub User",
      avatar_url: "",
    });
  }

  const token = signAuthToken(user);
  await acceptPendingInvitesForEmail(user.email);
  return res.json({ token, user: publicUser(user) });
});

router.get("/auth/google", (req, res, next) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(500).json({ message: "Google OAuth is not configured on server" });
  }

  const state = encodeState({ returnTo: safeReturnUrl(req.query.returnTo) });
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  const { returnTo } = decodeState(req.query.state);
  passport.authenticate("google", { session: false }, async (err, user) => {
    const targetBase = safeReturnUrl(returnTo);
    if (err || !user) {
      return res.redirect(`${targetBase.replace(/\/$/, "")}/login?oauth=failed`);
    }
    await acceptPendingInvitesForEmail(user.email);
    const token = signAuthToken(user);
    return res.redirect(`${targetBase.replace(/\/$/, "")}/oauth/callback?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

router.get("/auth/github", (req, res, next) => {
  if (!config.githubClientId || !config.githubClientSecret) {
    return res.status(500).json({ message: "GitHub OAuth is not configured on server" });
  }

  const state = encodeState({ returnTo: safeReturnUrl(req.query.returnTo) });
  return passport.authenticate("github", {
    session: false,
    scope: ["user:email"],
    state,
  })(req, res, next);
});

router.get("/auth/github/callback", (req, res, next) => {
  const { returnTo } = decodeState(req.query.state);
  passport.authenticate("github", { session: false }, async (err, user) => {
    const targetBase = safeReturnUrl(returnTo);
    if (err || !user) {
      return res.redirect(`${targetBase.replace(/\/$/, "")}/login?oauth=failed`);
    }
    await acceptPendingInvitesForEmail(user.email);
    const token = signAuthToken(user);
    return res.redirect(`${targetBase.replace(/\/$/, "")}/oauth/callback?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

router.get("/auth/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: "Invalid user" });
  }
  return res.json({ user: publicUser(user) });
});

router.post("/auth/change-password", authRequired, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.user.id, { passwordHash });
  return res.json({ ok: true });
});

router.get("/profiles/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({
    user_id: user.id,
    username: user.username,
    avatar_url: user.avatar_url || "",
    role: user.role || "",
    bio: user.bio || "",
    location: user.location || "",
    timezone: user.timezone || "",
    phone: user.phone || "",
    company: user.company || "",
    website: user.website || "",
  });
});

router.patch("/profiles/me", authRequired, async (req, res) => {
  const updates = {};
  if (typeof req.body.username === "string") {
    updates.username = req.body.username.trim();
  }
  if (typeof req.body.avatar_url === "string") {
    updates.avatar_url = req.body.avatar_url.trim();
  }
  if (typeof req.body.role === "string") updates.role = req.body.role.trim();
  if (typeof req.body.bio === "string") updates.bio = req.body.bio.trim();
  if (typeof req.body.location === "string") updates.location = req.body.location.trim();
  if (typeof req.body.timezone === "string") updates.timezone = req.body.timezone.trim();
  if (typeof req.body.phone === "string") updates.phone = req.body.phone.trim();
  if (typeof req.body.company === "string") updates.company = req.body.company.trim();
  if (typeof req.body.website === "string") updates.website = req.body.website.trim();

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({
    user_id: user.id,
    username: user.username,
    avatar_url: user.avatar_url || "",
    role: user.role || "",
    bio: user.bio || "",
    location: user.location || "",
    timezone: user.timezone || "",
    phone: user.phone || "",
    company: user.company || "",
    website: user.website || "",
  });
});

router.get("/settings", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    general: user.settings?.general || {},
    notifications: user.settings?.notifications || {},
  });
});

router.patch("/settings/general", authRequired, async (req, res) => {
  const updates = {
    "settings.general.workspace_name": req.body.workspace_name,
    "settings.general.language": req.body.language,
    "settings.general.timezone": req.body.timezone,
    "settings.general.week_starts_on": req.body.week_starts_on,
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined || updates[key] === null || updates[key] === "") delete updates[key];
  });

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({ general: user.settings?.general || {} });
});

router.patch("/settings/notifications", authRequired, async (req, res) => {
  const updates = {
    "settings.notifications.email_mentions": !!req.body.email_mentions,
    "settings.notifications.email_comments": !!req.body.email_comments,
    "settings.notifications.email_invites": !!req.body.email_invites,
    "settings.notifications.push_enabled": !!req.body.push_enabled,
    "settings.notifications.weekly_digest": !!req.body.weekly_digest,
  };

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({ notifications: user.settings?.notifications || {} });
});

router.get("/settings/users", authRequired, async (req, res) => {
  const invitations = await Invitation.find({ owner_id: req.user.id }).sort({ createdAt: -1 });
  const invitedEmails = invitations.map((inv) => inv.email);
  const existingUsers = invitedEmails.length
    ? await User.find({ email: { $in: invitedEmails } }).select("email username role")
    : [];
  const userMap = new Map(existingUsers.map((u) => [u.email, u]));

  const owner = await User.findById(req.user.id).select("email username role");
  const members = [
    {
      id: owner?.id || req.user.id,
      email: owner?.email || req.user.email,
      username: owner?.username || "Owner",
      role: owner?.role || "owner",
      status: "active",
      source: "owner",
    },
    ...invitations.map((inv) => {
      const matched = userMap.get(inv.email);
      return {
        id: matched?.id || inv.id,
        email: inv.email,
        username: matched?.username || inv.email.split("@")[0],
        role: inv.app_roles?.jira || "user",
        status: inv.status,
        source: matched ? "user" : "invite",
      };
    }),
  ];

  return res.json(members);
});

router.get("/settings/invitations", authRequired, async (req, res) => {
  const invitations = await Invitation.find({ owner_id: req.user.id }).sort({ createdAt: -1 });
  return res.json(invitations.map((inv) => inv.toJSON()));
});

router.post("/settings/invitations", authRequired, async (req, res) => {
  const { emails, app_roles, groups } = req.body;
  const emailList = Array.isArray(emails) ? emails : [];
  if (!emailList.length) {
    return res.status(400).json({ message: "At least one email is required" });
  }

  const inviter = await User.findById(req.user.id).select("username");
  const inviterName = inviter?.username || "A teammate";
  const results = [];

  for (const rawEmail of emailList) {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!emailPattern.test(email)) {
      results.push({ email, ok: false, message: "Invalid email" });
      continue;
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.findOneAndUpdate(
      { owner_id: req.user.id, email, status: "pending" },
      {
        owner_id: req.user.id,
        email,
        token,
        status: "pending",
        app_roles: {
          goals: app_roles?.goals || "user",
          jira: app_roles?.jira || "user",
          projects: app_roles?.projects || "user",
          jira_admin: app_roles?.jira_admin || "none",
        },
        groups: Array.isArray(groups) ? groups : [],
        expires_at: expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const inviteLink = `${config.appBaseUrl.replace(/\/$/, "")}/signup?invite=${encodeURIComponent(invitation.token)}`;
    try {
      await sendInvitationEmail({ toEmail: email, inviterName, inviteLink });
      await Notification.create({
        user_id: req.user.id,
        message: `Invitation sent to ${email}`,
        read: false,
      });
      results.push({ email, ok: true, message: "Invitation sent" });
    } catch (error) {
      results.push({ email, ok: false, message: error.message || "Email send failed" });
    }
  }

  return res.json({ results });
});

router.get("/workspaces", authRequired, async (req, res) => {
  const workspaces = await Workspace.find({ owner_id: req.user.id }).sort({ createdAt: -1 });

  const payload = workspaces.map((ws) => {
    const plain = ws.toJSON();
    const memberCount = plain.member_ids?.length || 1;
    return {
      ...plain,
      workspace_members: [{ count: memberCount }],
    };
  });

  return res.json(payload);
});

router.post("/workspaces", authRequired, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "name is required" });
  }

  const workspace = await Workspace.create({
    name: String(name).trim(),
    description: typeof description === "string" ? description.trim() : "",
    owner_id: req.user.id,
    member_ids: [req.user.id],
  });

  return res.status(201).json(workspace.toJSON());
});

router.delete("/workspaces/:id", authRequired, async (req, res) => {
  const workspace = await Workspace.findOne({ _id: req.params.id, owner_id: req.user.id });
  if (!workspace) {
    return res.status(404).json({ message: "Workspace not found" });
  }

  const boards = await Board.find({ workspace_id: req.params.id }).select("id");
  const boardIds = boards.map((b) => b.id);
  const tasks = boardIds.length ? await Task.find({ board_id: { $in: boardIds } }).select("id") : [];
  const taskIds = tasks.map((t) => t.id);

  await Workspace.deleteOne({ _id: req.params.id });
  if (boardIds.length) await Board.deleteMany({ workspace_id: req.params.id });
  if (boardIds.length) await Task.deleteMany({ board_id: { $in: boardIds } });
  if (taskIds.length) await Comment.deleteMany({ task_id: { $in: taskIds } });

  return res.json({ ok: true });
});

router.get("/boards", authRequired, async (req, res) => {
  const { workspaceId } = req.query;
  const workspaceFilter = workspaceId ? { _id: String(workspaceId), owner_id: req.user.id } : { owner_id: req.user.id };
  const workspaces = await Workspace.find(workspaceFilter).select("name");
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w.name]));

  const query = { workspace_id: { $in: [...workspaceMap.keys()] } };
  const boards = await Board.find(query).sort({ createdAt: -1 });

  const payload = boards.map((b) => {
    const plain = b.toJSON();
    return {
      ...plain,
      workspaces: { name: workspaceMap.get(plain.workspace_id) || "Unknown" },
    };
  });

  return res.json(payload);
});

router.post("/boards", authRequired, async (req, res) => {
  const { name, description, workspace_id } = req.body;
  if (!name || !workspace_id) {
    return res.status(400).json({ message: "name and workspace_id are required" });
  }

  const ws = await Workspace.findOne({ _id: workspace_id, owner_id: req.user.id });
  if (!ws) {
    return res.status(404).json({ message: "Workspace not found" });
  }

  const board = await Board.create({
    name: String(name).trim(),
    description: typeof description === "string" ? description.trim() : "",
    workspace_id,
  });

  return res.status(201).json(board.toJSON());
});

router.get("/tasks", authRequired, async (req, res) => {
  const { boardId } = req.query;
  const workspaceIds = (
    await Workspace.find({ owner_id: req.user.id }).select("id")
  ).map((w) => w.id);
  const boards = await Board.find({ workspace_id: { $in: workspaceIds } }).select("id workspace_id");
  const allowedBoardIds = new Set(boards.map((b) => b.id));

  let query = {};
  if (boardId) {
    if (!allowedBoardIds.has(String(boardId))) {
      return res.json([]);
    }
    query = { board_id: String(boardId) };
  } else {
    query = { board_id: { $in: [...allowedBoardIds] } };
  }

  const tasks = await Task.find(query).sort({ position: 1, createdAt: 1 });
  const userIds = Array.from(new Set(tasks.flatMap((t) => [t.assignee_id, t.created_by]).filter(Boolean)));
  const users = userIds.length ? await User.find({ _id: { $in: userIds } }).select("username avatar_url") : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const payload = tasks.map((t) => {
    const plain = t.toJSON();
    const assignee = plain.assignee_id ? userMap.get(plain.assignee_id) : null;
    const creator = plain.created_by ? userMap.get(plain.created_by) : null;
    return {
      ...plain,
      profiles: assignee
        ? { username: assignee.username, avatar_url: assignee.avatar_url || "" }
        : null,
      creator: creator ? { username: creator.username } : null,
    };
  });

  return res.json(payload);
});

router.post("/tasks", authRequired, async (req, res) => {
  if (!req.body.board_id || !String(req.body.title || "").trim()) {
    return res.status(400).json({ message: "board_id and title are required" });
  }

  const task = await Task.create({
    board_id: req.body.board_id,
    title: String(req.body.title || "").trim(),
    description: typeof req.body.description === "string" ? req.body.description.trim() : "",
    status: req.body.status || "todo",
    priority: req.body.priority || "medium",
    assignee_id: req.body.assignee_id || null,
    reporter: typeof req.body.reporter === "string" ? req.body.reporter.trim() : "",
    work_type: typeof req.body.work_type === "string" ? req.body.work_type : "task",
    parent: typeof req.body.parent === "string" ? req.body.parent.trim() : "",
    sprint: typeof req.body.sprint === "string" ? req.body.sprint.trim() : "",
    start_date: req.body.start_date || null,
    due_date: req.body.due_date || null,
    linked_item_type: typeof req.body.linked_item_type === "string" ? req.body.linked_item_type : "",
    linked_item_url: typeof req.body.linked_item_url === "string" ? req.body.linked_item_url.trim() : "",
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments.filter((x) => typeof x === "string") : [],
    created_by: req.user.id,
    position: typeof req.body.position === "number" ? req.body.position : 0,
  });

  return res.status(201).json(task.toJSON());
});

router.patch("/tasks/:id", authRequired, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  return res.json(task.toJSON());
});

router.delete("/tasks/:id", authRequired, async (req, res) => {
  await Comment.deleteMany({ task_id: req.params.id });
  const result = await Task.deleteOne({ _id: req.params.id });
  if (!result.deletedCount) {
    return res.status(404).json({ message: "Task not found" });
  }
  return res.json({ ok: true });
});

router.get("/comments", authRequired, async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) {
    return res.status(400).json({ message: "taskId is required" });
  }

  const comments = await Comment.find({ task_id: String(taskId) }).sort({ createdAt: 1 });
  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const users = userIds.length ? await User.find({ _id: { $in: userIds } }).select("username avatar_url") : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const payload = comments.map((c) => {
    const plain = c.toJSON();
    const user = userMap.get(plain.user_id);
    return {
      ...plain,
      created_at: c.createdAt,
      profiles: user ? { username: user.username, avatar_url: user.avatar_url || "" } : null,
    };
  });

  return res.json(payload);
});

router.post("/comments", authRequired, async (req, res) => {
  const { task_id, content } = req.body;
  if (!task_id || !content || !String(content).trim()) {
    return res.status(400).json({ message: "task_id and content are required" });
  }

  const comment = await Comment.create({
    task_id,
    content: String(content).trim(),
    user_id: req.user.id,
  });

  return res.status(201).json(comment.toJSON());
});

router.get("/notifications", authRequired, async (req, res) => {
  const notifications = await Notification.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  return res.json(notifications.map((n) => n.toJSON()));
});

router.patch("/notifications/:id/read", authRequired, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user_id: req.user.id }, { read: true });
  return res.json({ ok: true });
});

export default router;
