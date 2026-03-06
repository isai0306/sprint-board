import mongoose from "mongoose";

function transform(_doc, ret) {
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
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Board = mongoose.model("Board", boardSchema);
