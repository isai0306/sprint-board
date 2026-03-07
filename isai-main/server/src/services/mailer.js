import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtpHost || !config.smtpFrom) {
    throw new Error("SMTP is not configured. Set SMTP_HOST and SMTP_FROM in server/.env");
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser && config.smtpPass ? {
      user: config.smtpUser,
      pass: config.smtpPass,
    } : undefined,
  });

  return transporter;
}

export async function sendInvitationEmail({ toEmail, inviterName, inviteLink }) {
  const tx = getTransporter();

  await tx.sendMail({
    from: config.smtpFrom,
    to: toEmail,
    subject: `${inviterName} invited you to ISAI Workspace`,
    text: `You have been invited to join ISAI Workspace.\n\nAccept invite: ${inviteLink}\n\nThis link expires in 7 days.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>You are invited to ISAI Workspace</h2>
        <p><strong>${inviterName}</strong> invited you to collaborate.</p>
        <p>
          <a href="${inviteLink}" style="display:inline-block;padding:10px 16px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;">Accept Invitation</a>
        </p>
        <p>If the button does not work, open this URL:</p>
        <p>${inviteLink}</p>
        <p>This invitation expires in 7 days.</p>
      </div>
    `,
  });
}

export async function sendTaskAssignmentEmail({
  toEmail,
  assigneeName,
  assignerName,
  taskTitle,
  taskDescription,
  boardName,
  appBaseUrl,
}) {
  const tx = getTransporter();
  const safeTaskTitle = String(taskTitle || "Untitled task");
  const safeBoardName = String(boardName || "Sprint Board");
  const safeAssignerName = String(assignerName || "Teammate");
  const safeAssigneeName = String(assigneeName || "there");
  const taskLink = `${String(appBaseUrl || "").replace(/\/$/, "")}/boards`;

  await tx.sendMail({
    from: config.smtpFrom,
    to: toEmail,
    subject: `Task assigned: ${safeTaskTitle}`,
    text: `Hi ${safeAssigneeName},\n\n${safeAssignerName} assigned you a task in ${safeBoardName}.\n\nTask: ${safeTaskTitle}\n${taskDescription ? `Description: ${taskDescription}\n` : ""}\nOpen board: ${taskLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>New task assignment</h2>
        <p>Hi <strong>${safeAssigneeName}</strong>,</p>
        <p><strong>${safeAssignerName}</strong> assigned you a task in <strong>${safeBoardName}</strong>.</p>
        <p><strong>Task:</strong> ${safeTaskTitle}</p>
        ${taskDescription ? `<p><strong>Description:</strong> ${taskDescription}</p>` : ""}
        <p><a href="${taskLink}" style="display:inline-block;padding:10px 16px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;">Open Board</a></p>
      </div>
    `,
  });
}
