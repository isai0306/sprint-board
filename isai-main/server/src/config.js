import dotenv from "dotenv";

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "";

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  frontendUrl,
  clientUrl: frontendUrl,
  clientUrls: (
    process.env.CLIENT_URLS || frontendUrl
  )
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
  appBaseUrl: process.env.APP_BASE_URL || frontendUrl,
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  webhookAllowedRepos: (process.env.WEBHOOK_ALLOWED_REPOS || "")
    .split(",")
    .map((repo) => repo.trim().toLowerCase())
    .filter(Boolean),
  webhookAutoMarkDone: String(process.env.WEBHOOK_AUTO_MARK_DONE || "false").toLowerCase() === "true",
};
