import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const taskSchema = new mongoose.Schema(
  {
    board_id: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignee_id: { type: String, default: null },
    reporter: { type: String, default: "" },
    work_type: { type: String, default: "task" },
    parent: { type: String, default: "" },
    sprint: { type: String, default: "" },
    start_date: { type: String, default: null },
    due_date: { type: String, default: null },
    linked_item_type: { type: String, default: "" },
    linked_item_url: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    created_by: { type: String, required: true, index: true },
    position: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Task = mongoose.model("Task", taskSchema);
