import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { buildIcs } from "./ics.js";

const APP_NAME = "Kormopulse";

let transporter;

const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const appLink = (path = "") => `${config.clientUrl}${path}`;

const button = (href, label) =>
  `<p><a href="${href}" style="display:inline-block;background:#9E0A57;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${label}</a></p>`;

const formatWhen = (date) =>
  new Date(date).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }) + " (Bangladesh time)";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const layout = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">
    <h2 style="color:#9E0A57;margin-bottom:4px">${APP_NAME}</h2>
    <h3 style="margin-top:0">${title}</h3>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
    <p style="font-size:12px;color:#888">This is an automated message from ${APP_NAME}. Please do not reply.</p>
  </div>`;

/**
 * Sends an email. Never throws: a mail failure must not break the API request
 * that triggered it. Returns true when the message was handed to the SMTP server.
 */
export const sendMail = async ({ to, subject, text, html, attachments }) => {
  if (!to) return false;

  if (!isMailConfigured()) {
    console.warn(`[mail] SMTP is not configured; skipped "${subject}" to ${to}`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `${APP_NAME} <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    return true;
  } catch (error) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, error.message);
    return false;
  }
};

export const sendPasswordResetCode = async ({ to, name, code, expiresInMinutes }) => {
  const sent = await sendMail({
    to,
    subject: `${APP_NAME} password reset code`,
    text: `Hi ${name},\n\nYour ${APP_NAME} password reset code is ${code}. It expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: layout(
      "Reset your password",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Use this code to reset your password. It expires in ${expiresInMinutes} minutes.</p>
       <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#9E0A57">${code}</p>
       <p>If you did not request this, you can safely ignore this email.</p>`
    ),
  });

  // Development convenience only: lets you test the flow without SMTP.
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[mail:dev] Password reset code for ${to}: ${code}`);
  }
  return sent;
};

export const sendApplicationReceived = ({ to, name, jobTitle, companyName }) =>
  sendMail({
    to,
    subject: `Application submitted: ${jobTitle}`,
    text: `Hi ${name},\n\nYour application for "${jobTitle}" at ${companyName} has been submitted. We will let you know when the employer updates its status.`,
    html: layout(
      "Application submitted",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Your application for <b>${escapeHtml(jobTitle)}</b> at <b>${escapeHtml(companyName)}</b> has been submitted.</p>
       <p>We will email you when the employer updates its status.</p>`
    ),
  });

export const sendNewApplicationAlert = ({ to, employerName, applicantName, jobTitle }) =>
  sendMail({
    to,
    subject: `New application for ${jobTitle}`,
    text: `Hi ${employerName},\n\n${applicantName} has applied for "${jobTitle}". Log in to ${APP_NAME} to review the application.`,
    html: layout(
      "New application received",
      `<p>Hi ${escapeHtml(employerName)},</p>
       <p><b>${escapeHtml(applicantName)}</b> has applied for <b>${escapeHtml(jobTitle)}</b>.</p>
       <p>Log in to ${APP_NAME} to review the application.</p>`
    ),
  });

export const sendShortlisted = ({ to, name, jobTitle, companyName }) =>
  sendMail({
    to,
    subject: `Good news: you were shortlisted for ${jobTitle}`,
    text: `Hi ${name},\n\nGood news! ${companyName} has shortlisted you for "${jobTitle}". They may contact you soon, so keep an eye on your ${APP_NAME} messages.`,
    html: layout(
      "You have been shortlisted",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Good news! <b>${escapeHtml(companyName)}</b> has shortlisted you for <b>${escapeHtml(jobTitle)}</b>.</p>
       <p>They may contact you soon, so keep an eye on your ${APP_NAME} messages.</p>`
    ),
  });

export const sendHired = ({ to, name, jobTitle, companyName }) =>
  sendMail({
    to,
    subject: `Congratulations! You were selected for ${jobTitle}`,
    text: `Hi ${name},\n\nCongratulations! ${companyName} has selected you for "${jobTitle}". They will contact you with the next steps.`,
    html: layout(
      "Congratulations!",
      `<p>Hi ${escapeHtml(name)},</p>
       <p><b>${escapeHtml(companyName)}</b> has selected you for <b>${escapeHtml(jobTitle)}</b>.</p>
       <p>They will contact you with the next steps.</p>`
    ),
  });

export const sendEmailVerificationCode = async ({ to, name, code, expiresInMinutes }) => {
  const sent = await sendMail({
    to,
    subject: `Verify your ${APP_NAME} email`,
    text: `Hi ${name},\n\nWelcome to ${APP_NAME}! Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    html: layout(
      "Verify your email",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Welcome to ${APP_NAME}! Enter this code to verify your email address. It expires in ${expiresInMinutes} minutes.</p>
       <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#9E0A57">${code}</p>`
    ),
  });
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[mail:dev] Email verification code for ${to}: ${code}`);
  }
  return sent;
};

export const sendApplicationRejected = ({ to, name, jobTitle, companyName }) =>
  sendMail({
    to,
    subject: `Update on your application for ${jobTitle}`,
    text: `Hi ${name},\n\nThank you for applying for "${jobTitle}" at ${companyName}. After careful consideration they have decided not to move forward with your application. We wish you every success and encourage you to keep exploring roles on ${APP_NAME}.`,
    html: layout(
      "Application update",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Thank you for applying for <b>${escapeHtml(jobTitle)}</b> at <b>${escapeHtml(companyName)}</b>. After careful consideration they have decided not to move forward with your application.</p>
       <p>We wish you every success and encourage you to keep exploring roles on ${APP_NAME}.</p>
       ${button(appLink("/jobs"), "Browse more jobs")}`
    ),
  });

const interviewDetailsHtml = (interview) => `
  <ul>
    <li><b>Format:</b> ${escapeHtml(interview.mode)}</li>
    <li><b>Duration:</b> ${interview.durationMinutes} minutes</li>
    ${interview.meetingLink ? `<li><b>Meeting link:</b> <a href="${escapeHtml(interview.meetingLink)}">${escapeHtml(interview.meetingLink)}</a></li>` : ""}
    ${interview.location ? `<li><b>Location:</b> ${escapeHtml(interview.location)}</li>` : ""}
    ${interview.notes ? `<li><b>Notes:</b> ${escapeHtml(interview.notes)}</li>` : ""}
  </ul>`;

export const sendInterviewProposed = ({ to, name, jobTitle, companyName, interview }) =>
  sendMail({
    to,
    subject: `Interview invitation: ${jobTitle} at ${companyName}`,
    text: `Hi ${name},\n\n${companyName} would like to interview you for "${jobTitle}". Please log in to ${APP_NAME} and choose one of these times:\n${interview.slots
      .map((slot, i) => `${i + 1}. ${formatWhen(slot)}`)
      .join("\n")}\n\n${appLink("/interviews")}`,
    html: layout(
      "You have been invited to interview",
      `<p>Hi ${escapeHtml(name)},</p>
       <p><b>${escapeHtml(companyName)}</b> would like to interview you for <b>${escapeHtml(jobTitle)}</b>. Please choose the time that suits you:</p>
       <ol>${interview.slots.map((slot) => `<li>${formatWhen(slot)}</li>`).join("")}</ol>
       ${interviewDetailsHtml(interview)}
       ${button(appLink("/interviews"), "Choose a time")}`
    ),
  });

const icsAttachment = ({ interview, jobTitle, companyName, organizer, attendee, cancelled }) => ({
  filename: "interview.ics",
  contentType: `text/calendar; charset=utf-8; method=${cancelled ? "CANCEL" : "REQUEST"}`,
  content: buildIcs({
    uid: String(interview._id),
    start: interview.selectedSlot || interview.slots[0],
    durationMinutes: interview.durationMinutes,
    title: `Interview: ${jobTitle} (${companyName})`,
    description: [interview.notes, interview.meetingLink && `Meeting link: ${interview.meetingLink}`]
      .filter(Boolean)
      .join("\n"),
    location: interview.location || interview.meetingLink || "",
    url: interview.meetingLink || undefined,
    organizer,
    attendees: [attendee],
    sequence: cancelled ? 1 : 0,
    cancelled,
  }),
});

/** Sent to both parties once the candidate picks a slot; includes a calendar invite. */
export const sendInterviewConfirmed = ({ to, name, otherName, jobTitle, companyName, interview, organizer, attendee }) =>
  sendMail({
    to,
    subject: `Interview confirmed: ${jobTitle}`,
    text: `Hi ${name},\n\nThe interview for "${jobTitle}" (${companyName}) with ${otherName} is confirmed for ${formatWhen(interview.selectedSlot)}. A calendar invite is attached.`,
    html: layout(
      "Interview confirmed",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>The interview for <b>${escapeHtml(jobTitle)}</b> (${escapeHtml(companyName)}) with <b>${escapeHtml(otherName)}</b> is confirmed for:</p>
       <p style="font-size:18px"><b>${formatWhen(interview.selectedSlot)}</b></p>
       ${interviewDetailsHtml(interview)}
       <p>A calendar invite is attached to this email.</p>`
    ),
    attachments: [icsAttachment({ interview, jobTitle, companyName, organizer, attendee })],
  });

export const sendInterviewCancelled = ({ to, name, jobTitle, companyName, interview, organizer, attendee }) =>
  sendMail({
    to,
    subject: `Interview cancelled: ${jobTitle}`,
    text: `Hi ${name},\n\nThe interview for "${jobTitle}" at ${companyName} has been cancelled. The employer may propose new times.`,
    html: layout(
      "Interview cancelled",
      `<p>Hi ${escapeHtml(name)},</p>
       <p>The interview for <b>${escapeHtml(jobTitle)}</b> at <b>${escapeHtml(companyName)}</b> has been cancelled. The employer may propose new times.</p>`
    ),
    attachments: interview.selectedSlot
      ? [icsAttachment({ interview, jobTitle, companyName, organizer, attendee, cancelled: true })]
      : undefined,
  });

export const sendInterviewDeclined = ({ to, employerName, candidateName, jobTitle, reason }) =>
  sendMail({
    to,
    subject: `${candidateName} declined the interview slots for ${jobTitle}`,
    text: `Hi ${employerName},\n\n${candidateName} cannot make any of the proposed times for "${jobTitle}".${reason ? `\nReason: ${reason}` : ""}\nYou can propose new times from your ${APP_NAME} dashboard.`,
    html: layout(
      "Interview slots declined",
      `<p>Hi ${escapeHtml(employerName)},</p>
       <p><b>${escapeHtml(candidateName)}</b> cannot make any of the proposed times for <b>${escapeHtml(jobTitle)}</b>.</p>
       ${reason ? `<p><b>Reason:</b> ${escapeHtml(reason)}</p>` : ""}
       ${button(appLink("/interviews"), "Propose new times")}`
    ),
  });

export const sendJobAlertDigest = ({ to, name, alertName, jobs }) =>
  sendMail({
    to,
    subject: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} for your alert "${alertName}"`,
    text: `Hi ${name},\n\nNew jobs matching "${alertName}":\n${jobs
      .map((job) => `- ${job.title} (${job.companyName}) ${appLink(`/jobs/${job._id}`)}`)
      .join("\n")}`,
    html: layout(
      `New jobs for "${escapeHtml(alertName)}"`,
      `<p>Hi ${escapeHtml(name)}, here are the newest matches:</p>
       <ul>${jobs
         .map(
           (job) =>
             `<li style="margin-bottom:8px"><a href="${appLink(`/jobs/${job._id}`)}"><b>${escapeHtml(job.title)}</b></a><br/>${escapeHtml(job.companyName)} &middot; ${escapeHtml(job.location)}</li>`
         )
         .join("")}</ul>
       ${button(appLink("/alerts"), "Manage alerts")}`
    ),
  });
