import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    username: { type: String, required: true, trim: true },
    avatar_url: { type: String, default: "" },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    timezone: { type: String, default: "" },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    website: { type: String, default: "" },
    settings: {
      general: {
        workspace_name: { type: String, default: "My Workspace" },
        language: { type: String, default: "en" },
        timezone: { type: String, default: "Asia/Kolkata" },
        week_starts_on: { type: String, default: "monday" },
      },
      notifications: {
        email_mentions: { type: Boolean, default: true },
        email_comments: { type: Boolean, default: true },
        email_invites: { type: Boolean, default: true },
        push_enabled: { type: Boolean, default: false },
        weekly_digest: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const User = mongoose.model("User", userSchema);
