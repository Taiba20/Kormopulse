import nodemailer from "nodemailer";

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
export const sendMail = async ({ to, subject, text, html }) => {
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
