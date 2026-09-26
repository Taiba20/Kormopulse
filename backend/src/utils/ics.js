// Minimal RFC 5545 iCalendar generator for interview invitations.

const pad = (n) => String(n).padStart(2, "0");

/** 2026-10-02T09:30:00Z -> 20261002T093000Z */
export const toIcsDate = (date) => {
  const d = new Date(date);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

const escapeText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

// Lines must be folded at 75 octets; continuation lines start with a space.
const fold = (line) => {
  const chunks = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut -= 1;
    chunks.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  chunks.push(rest);
  return chunks.join("\r\n");
};

/**
 * @param {{ uid: string, start: Date, durationMinutes: number, title: string,
 *   description?: string, location?: string, url?: string,
 *   organizer?: { name: string, email: string }, attendees?: {name: string, email: string}[],
 *   sequence?: number, cancelled?: boolean }} event
 */
export const buildIcs = (event) => {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + (event.durationMinutes || 30) * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kormopulse//Interview Scheduler//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.cancelled ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}@kormopulse`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    `STATUS:${event.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  if (event.organizer?.email) {
    lines.push(`ORGANIZER;CN=${escapeText(event.organizer.name || "")}:mailto:${event.organizer.email}`);
  }
  for (const attendee of event.attendees || []) {
    lines.push(
      `ATTENDEE;CN=${escapeText(attendee.name || "")};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${attendee.email}`
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
};
