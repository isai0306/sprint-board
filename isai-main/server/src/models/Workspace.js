import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    owner_id: { type: String, required: true, index: true },
    member_ids: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Workspace = mongoose.model("Workspace", workspaceSchema);
