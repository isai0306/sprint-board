import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const boardDeveloperActivitySchema = new mongoose.Schema(
  {
    board_id: { type: String, required: true, index: true },
    repo_owner: { type: String, default: "", trim: true, lowercase: true, index: true },
    repo_name: { type: String, default: "", trim: true, lowercase: true, index: true },
    author_key: { type: String, required: true, trim: true, lowercase: true },
    author_name: { type: String, required: true, trim: true },
    author_avatar_url: { type: String, default: "", trim: true },
    commit_count: { type: Number, default: 0 },
    task_ids: { type: [String], default: [] },
    last_activity_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

boardDeveloperActivitySchema.index({ board_id: 1, author_key: 1 }, { unique: true });

export const BoardDeveloperActivity = mongoose.model(
  "BoardDeveloperActivity",
  boardDeveloperActivitySchema
);
