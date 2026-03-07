import mongoose from "mongoose";

function transform(_doc, ret) {
  if (ret.github) {
    ret.github.webhook_configured = Boolean(ret.github.webhook_secret);
    delete ret.github.webhook_secret;
  }
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    workspace_id: { type: String, required: true, index: true },
    github: {
      connected: { type: Boolean, default: false, index: true },
      repository_url: { type: String, default: "", trim: true },
      repo_owner: { type: String, default: "", trim: true, lowercase: true, index: true },
      repo_name: { type: String, default: "", trim: true, lowercase: true, index: true },
      webhook_secret: { type: String, default: "", trim: true },
      auto_mark_done: { type: Boolean, default: false },
      connected_at: { type: Date, default: null },
      disconnected_at: { type: Date, default: null },
      last_sync_at: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Board = mongoose.model("Board", boardSchema);
