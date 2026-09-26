import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { buildIcs } from "./ics.js";
import { tr, normalizeLanguage, formatNumberFor } from "./i18n.js";

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

const formatWhen = (date, lang) =>
  new Date(date).toLocaleString(normalizeLanguage(lang) === "bn" ? "bn-BD" : "en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }) + tr(lang, "common.timeSuffix");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const layout = (lang, title, bodyHtml) => `
  <div style="font-family:Arial,'Noto Sans Bengali',sans-serif;max-width:560px;margin:auto;color:#222">
    <h2 style="color:#9E0A57;margin-bottom:4px">${APP_NAME}</h2>
    <h3 style="margin-top:0">${title}</h3>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
    <p style="font-size:12px;color:#888">${tr(lang, "common.footer", { app: APP_NAME })}</p>
  </div>`;

const greetingHtml = (lang, name) => `<p>${tr(lang, "common.greeting", { name }, { html: true })}</p>`;

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

// Shorthand: the same translation for the plain-text (raw values) and HTML (escaped values) parts.
const both = (lang, key, params) => ({
  text: tr(lang, `mail.${key}.text`, { app: APP_NAME, ...params }),
  html: tr(lang, `mail.${key}.html`, { app: APP_NAME, ...params }, { html: true }),
  subject: tr(lang, `mail.${key}.subject`, { app: APP_NAME, ...params }),
  title: tr(lang, `mail.${key}.title`, { app: APP_NAME, ...params }),
});

export const sendPasswordResetCode = async ({ to, name, code, expiresInMinutes, lang }) => {
  const params = { name, code, minutes: expiresInMinutes };
  const m = both(lang, "passwordReset", params);
  const sent = await sendMail({
    to,
    subject: m.subject,
    text: m.text,
    html: layout(
      lang,
      m.title,
      `${greetingHtml(lang, name)}
       ${m.html}
       <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#9E0A57">${code}</p>
       ${tr(lang, "mail.passwordReset.htmlIgnore")}`
    ),
  });

  // Development convenience only: lets you test the flow without SMTP.
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[mail:dev] Password reset code for ${to}: ${code}`);
  }
  return sent;
};

export const sendApplicationReceived = ({ to, name, jobTitle, companyName, lang }) => {
  const m = both(lang, "applicationReceived", { name, jobTitle, companyName });
  return sendMail({ to, subject: m.subject, text: m.text, html: layout(lang, m.title, `${greetingHtml(lang, name)}${m.html}`) });
};

export const sendNewApplicationAlert = ({ to, employerName, applicantName, jobTitle, lang }) => {
  const m = both(lang, "newApplication", { name: employerName, applicantName, jobTitle });
  return sendMail({ to, subject: m.subject, text: m.text, html: layout(lang, m.title, `${greetingHtml(lang, employerName)}${m.html}`) });
};

export const sendShortlisted = ({ to, name, jobTitle, companyName, lang }) => {
  const m = both(lang, "shortlisted", { name, jobTitle, companyName });
  return sendMail({ to, subject: m.subject, text: m.text, html: layout(lang, m.title, `${greetingHtml(lang, name)}${m.html}`) });
};

export const sendHired = ({ to, name, jobTitle, companyName, lang }) => {
  const m = both(lang, "hired", { name, jobTitle, companyName });
  return sendMail({ to, subject: m.subject, text: m.text, html: layout(lang, m.title, `${greetingHtml(lang, name)}${m.html}`) });
};

export const sendEmailVerificationCode = async ({ to, name, code, expiresInMinutes, lang }) => {
  const m = both(lang, "verifyEmail", { name, code, minutes: expiresInMinutes });
  const sent = await sendMail({
    to,
    subject: m.subject,
    text: m.text,
    html: layout(
      lang,
      m.title,
      `${greetingHtml(lang, name)}
       ${m.html}
       <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#9E0A57">${code}</p>`
    ),
  });
  if (!sent && process.env.NODE_ENV !== "production") {
    console.log(`[mail:dev] Email verification code for ${to}: ${code}`);
  }
  return sent;
};

export const sendApplicationRejected = ({ to, name, jobTitle, companyName, lang }) => {
  const m = both(lang, "rejected", { name, jobTitle, companyName });
  return sendMail({
    to,
    subject: m.subject,
    text: m.text,
    html: layout(lang, m.title, `${greetingHtml(lang, name)}${m.html}${button(appLink("/jobs"), tr(lang, "mail.rejected.button"))}`),
  });
};

const interviewDetailsHtml = (interview, lang) => {
  const label = (key) => tr(lang, `mail.interviewDetails.${key}`);
  const modeKey = `mail.interviewDetails.modes.${interview.mode}`;
  const mode = tr(lang, modeKey) === modeKey ? interview.mode : tr(lang, modeKey);
  return `
  <ul>
    <li><b>${label("format")}:</b> ${escapeHtml(mode)}</li>
    <li><b>${label("duration")}:</b> ${tr(lang, "mail.interviewDetails.minutes", { n: formatNumberFor(lang, interview.durationMinutes) })}</li>
    ${interview.meetingLink ? `<li><b>${label("meetingLink")}:</b> <a href="${escapeHtml(interview.meetingLink)}">${escapeHtml(interview.meetingLink)}</a></li>` : ""}
    ${interview.location ? `<li><b>${label("location")}:</b> ${escapeHtml(interview.location)}</li>` : ""}
    ${interview.notes ? `<li><b>${label("notes")}:</b> ${escapeHtml(interview.notes)}</li>` : ""}
  </ul>`;
};

export const sendInterviewProposed = ({ to, name, jobTitle, companyName, interview, lang }) => {
  const slots = interview.slots.map((slot, i) => `${i + 1}. ${formatWhen(slot, lang)}`).join("\n");
  const m = both(lang, "interviewProposed", { name, jobTitle, companyName, slots: "", link: "" });
  return sendMail({
    to,
    subject: m.subject,
    text: tr(lang, "mail.interviewProposed.text", { app: APP_NAME, name, jobTitle, companyName, slots, link: appLink("/interviews") }),
    html: layout(
      lang,
      m.title,
      `${greetingHtml(lang, name)}
       ${m.html}
       <ol>${interview.slots.map((slot) => `<li>${formatWhen(slot, lang)}</li>`).join("")}</ol>
       ${interviewDetailsHtml(interview, lang)}
       ${button(appLink("/interviews"), tr(lang, "mail.interviewProposed.button"))}`
    ),
  });
};

const icsAttachment = ({ interview, jobTitle, companyName, organizer, attendee, cancelled, lang }) => ({
  filename: "interview.ics",
  contentType: `text/calendar; charset=utf-8; method=${cancelled ? "CANCEL" : "REQUEST"}`,
  content: buildIcs({
    uid: String(interview._id),
    start: interview.selectedSlot || interview.slots[0],
    durationMinutes: interview.durationMinutes,
    title: tr(lang, "mail.ics.title", { jobTitle, companyName }),
    description: [interview.notes, interview.meetingLink && tr(lang, "mail.ics.meetingLink", { link: interview.meetingLink })]
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
export const sendInterviewConfirmed = ({ to, name, otherName, jobTitle, companyName, interview, organizer, attendee, lang }) => {
  const when = formatWhen(interview.selectedSlot, lang);
  const params = { name, otherName, jobTitle, companyName, when };
  const m = both(lang, "interviewConfirmed", params);
  return sendMail({
    to,
    subject: m.subject,
    text: m.text,
    html: layout(
      lang,
      m.title,
      `${greetingHtml(lang, name)}
       ${m.html}
       <p style="font-size:18px"><b>${when}</b></p>
       ${interviewDetailsHtml(interview, lang)}
       ${tr(lang, "mail.interviewConfirmed.htmlAttached")}`
    ),
    attachments: [icsAttachment({ interview, jobTitle, companyName, organizer, attendee, lang })],
  });
};

export const sendInterviewCancelled = ({ to, name, jobTitle, companyName, interview, organizer, attendee, lang }) => {
  const m = both(lang, "interviewCancelled", { name, jobTitle, companyName });
  return sendMail({
    to,
    subject: m.subject,
    text: m.text,
    html: layout(lang, m.title, `${greetingHtml(lang, name)}${m.html}`),
    attachments: interview.selectedSlot
      ? [icsAttachment({ interview, jobTitle, companyName, organizer, attendee, cancelled: true, lang })]
      : undefined,
  });
};

export const sendInterviewDeclined = ({ to, employerName, candidateName, jobTitle, reason, lang }) => {
  const reasonLine = reason ? tr(lang, "mail.interviewDeclined.reasonLine", { reason }) : "";
  const params = { name: employerName, candidateName, jobTitle };
  const m = both(lang, "interviewDeclined", { ...params, reasonLine: "" });
  return sendMail({
    to,
    subject: m.subject,
    text: tr(lang, "mail.interviewDeclined.text", { app: APP_NAME, ...params, reasonLine }),
    html: layout(
      lang,
      m.title,
      `${greetingHtml(lang, employerName)}
       ${m.html}
       ${reason ? tr(lang, "mail.interviewDeclined.reasonHtml", { reason }, { html: true }) : ""}
       ${button(appLink("/interviews"), tr(lang, "mail.interviewDeclined.button"))}`
    ),
  });
};

export const sendJobAlertDigest = ({ to, name, alertName, jobs, lang }) => {
  const count = jobs.length;
  const subjectKey = count === 1 ? "mail.alertDigest.subject_one" : "mail.alertDigest.subject_other";
  const lines = jobs.map((job) => `- ${job.title} (${job.companyName}) ${appLink(`/jobs/${job._id}`)}`).join("\n");
  return sendMail({
    to,
    subject: tr(lang, subjectKey, { count: formatNumberFor(lang, count), alertName }),
    text: tr(lang, "mail.alertDigest.text", { name, alertName, lines }),
    html: layout(
      lang,
      tr(lang, "mail.alertDigest.title", { alertName }, { html: true }),
      `<p>${tr(lang, "mail.alertDigest.intro", { name }, { html: true })}</p>
       <ul>${jobs
         .map(
           (job) =>
             `<li style="margin-bottom:8px"><a href="${appLink(`/jobs/${job._id}`)}"><b>${escapeHtml(job.title)}</b></a><br/>${escapeHtml(job.companyName)} &middot; ${escapeHtml(job.location)}</li>`
         )
         .join("")}</ul>
       ${button(appLink("/alerts"), tr(lang, "mail.alertDigest.button"))}`
    ),
  });
};
