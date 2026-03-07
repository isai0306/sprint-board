import mongoose from "mongoose";

function transform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const invitationSchema = new mongoose.Schema(
  {
    owner_id: { type: String, required: true, index: true },
    workspace_id: { type: String, default: "", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "expired", "revoked"], default: "pending", index: true },
    app_roles: {
      goals: { type: String, default: "user" },
      jira: { type: String, default: "user" },
      projects: { type: String, default: "user" },
      jira_admin: { type: String, default: "none" },
    },
    groups: { type: [String], default: [] },
    accepted_at: { type: Date, default: null },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: { transform },
  }
);

export const Invitation = mongoose.model("Invitation", invitationSchema);
