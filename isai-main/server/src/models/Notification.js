import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
