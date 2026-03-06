import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const commentSchema = new mongoose.Schema(
  {
    task_id: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true },
    user_id: { type: String, required: true, default: "system", index: true },
    source: { type: String, default: "manual", index: true },
    author_name: { type: String, default: "", trim: true },
    author_avatar_url: { type: String, default: "", trim: true },
    commit_sha: { type: String, default: "", trim: true },
    commit_url: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Comment = mongoose.model("Comment", commentSchema);
