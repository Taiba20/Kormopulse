import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";
import { buildIcs, toIcsDate } from "../src/utils/ics.js";

let env;
before(async () => {
  env = await startTestEnv();
});
after(async () => {
  await env.stop();
});

const inDays = (days, hour = 10) => {
  const d = new Date(Date.now() + days * 86400000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

describe("ICS generator (unit)", () => {
  it("formats UTC dates", () => {
    assert.equal(toIcsDate("2026-10-02T09:30:00.000Z"), "20261002T093000Z");
  });

  it("produces a valid, escaped, folded calendar file", () => {
    const ics = buildIcs({
      uid: "abc123",
      start: "2026-10-02T09:30:00.000Z",
      durationMinutes: 45,
      title: "Interview: Dev, Senior; (Acme)",
      description: "Line one\nLine two with a comma, and a very long sentence that must be folded because it is longer than seventy five characters.",
      location: "Dhaka, BD",
      organizer: { name: "Erin", email: "erin@acme.test" },
      attendees: [{ name: "Sam", email: "sam@test.com" }],
    });
    assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.match(ics, /DTSTART:20261002T093000Z/);
    assert.match(ics, /DTEND:20261002T101500Z/);
    assert.match(ics, /SUMMARY:Interview: Dev\\, Senior\\; \(Acme\)/);
    assert.match(ics, /ORGANIZER;CN=Erin:mailto:erin@acme.test/);
    for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `line too long: ${line}`);
    assert.match(buildIcs({ uid: "x", start: new Date(), title: "T", cancelled: true }), /METHOD:CANCEL/);
  });
});

describe("interview scheduling", () => {
  let employer, seeker, job, application;

  before(async () => {
    employer = await env.makeEmployer({ email: "i-emp@test.com", name: "Erin Employer", companyName: "Acme Ltd" });
    seeker = await env.makeSeeker({ email: "i-seek@test.com", name: "Sam Seeker" });
    job = await env.makeJob(employer, { title: "Platform Engineer" });
    application = await env.applyTo(seeker, job);
  });

  const proposeBody = () => ({
    applicationId: String(application._id),
    slots: [inDays(3), inDays(4), inDays(5)],
    durationMinutes: 45,
    mode: "online",
    meetingLink: "https://meet.example.com/abc",
    notes: "Bring your portfolio",
  });

  it("validates the proposal", async () => {
    const post = (body) => env.api.post("/api/interviews").set(env.auth(employer.token)).send(body);
    assert.equal((await post({ ...proposeBody(), slots: [] })).status, 400);
    assert.equal((await post({ ...proposeBody(), slots: [inDays(-1)] })).status, 400);
    assert.equal((await post({ ...proposeBody(), slots: [inDays(2), inDays(2)] })).status, 400);
    assert.equal((await post({ ...proposeBody(), slots: [1, 2, 3, 4, 5, 6].map((d) => inDays(d)) })).status, 400);
    assert.equal((await post({ ...proposeBody(), meetingLink: "" })).status, 400);
    assert.equal((await post({ ...proposeBody(), mode: "onsite", meetingLink: undefined })).status, 400);
    assert.equal((await post({ ...proposeBody(), slots: ["not a date"] })).status, 400);
    assert.equal((await post({ ...proposeBody(), applicationId: "123" })).status, 400);
  });

  it("only the owning employer can propose", async () => {
    const other = await env.makeEmployer({ email: "i-other@test.com" });
    assert.equal((await env.api.post("/api/interviews").set(env.auth(other.token)).send(proposeBody())).status, 403);
    assert.equal((await env.api.post("/api/interviews").set(env.auth(seeker.token)).send(proposeBody())).status, 403);
  });

  it("proposing moves the application to the interview stage and invites the candidate", async () => {
    env.clearMails();
    const res = await env.api.post("/api/interviews").set(env.auth(employer.token)).send(proposeBody());
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.data.status, "proposed");
    assert.equal(res.body.data.slots.length, 3);

    const stored = await env.models.Application.findById(application._id);
    assert.equal(stored.status, "interview");

    const mail = await env.waitForMail((m) => /i-seek@test.com/.test(m.to.text) && /Interview invitation/.test(m.subject));
    assert.match(mail.text, /Platform Engineer/);
    assert.match(mail.text, /Acme Ltd/);
    const note = await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, type: "interview" }));
    assert.equal(note.link, "/interviews");
  });

  it("lists interviews for both parties", async () => {
    const mine = await env.api.get("/api/interviews/mine").set(env.auth(seeker.token));
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.interviews.length, 1);
    assert.equal(mine.body.data.interviews[0].job.title, "Platform Engineer");
    assert.equal(mine.body.data.interviews[0].employer.name, "Erin Employer");

    const theirs = await env.api.get("/api/interviews/mine").set(env.auth(employer.token));
    assert.equal(theirs.body.data.interviews[0].candidate.name, "Sam Seeker");
  });

  it("re-proposing supersedes the pending proposal", async () => {
    const res = await env.api.post("/api/interviews").set(env.auth(employer.token)).send({ ...proposeBody(), slots: [inDays(6), inDays(7)] });
    assert.equal(res.status, 201);
    const all = await env.models.Interview.find({ application: application._id }).sort({ createdAt: 1 });
    assert.deepEqual(all.map((i) => i.status), ["cancelled", "proposed"]);
  });

  it("candidate confirms a slot: both get a calendar invite", async () => {
    env.clearMails();
    const interview = await env.models.Interview.findOne({ application: application._id, status: "proposed" });

    // Wrong role / bad index
    assert.equal((await env.api.post(`/api/interviews/${interview._id}/confirm`).set(env.auth(employer.token)).send({ slotIndex: 0 })).status, 403);
    assert.equal((await env.api.post(`/api/interviews/${interview._id}/confirm`).set(env.auth(seeker.token)).send({ slotIndex: 4 })).status, 400);

    const res = await env.api.post(`/api/interviews/${interview._id}/confirm`).set(env.auth(seeker.token)).send({ slotIndex: 1 });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.status, "confirmed");
    assert.equal(new Date(res.body.data.selectedSlot).toISOString(), interview.slots[1].toISOString());

    for (const address of ["i-seek@test.com", "i-emp@test.com"]) {
      const mail = await env.waitForMail((m) => m.to.text.includes(address) && /Interview confirmed/.test(m.subject));
      const ics = mail.attachments.find((a) => /calendar/.test(a.contentType));
      assert.ok(ics, `no calendar attachment for ${address}`);
      const body = ics.content.toString();
      assert.match(body, /BEGIN:VEVENT/);
      assert.match(body, /METHOD:REQUEST/);
      assert.ok(body.includes(`DTSTART:${toIcsDate(interview.slots[1])}`));
      assert.match(body, /SUMMARY:Interview: Platform Engineer/);
    }

    const note = await env.waitFor(() => env.models.Notification.findOne({ user: employer.id, title: /confirmed the interview/ }));
    assert.ok(note);

    // Cannot confirm twice
    assert.equal((await env.api.post(`/api/interviews/${interview._id}/confirm`).set(env.auth(seeker.token)).send({ slotIndex: 0 })).status, 409);
  });

  it("downloads the .ics for a confirmed interview (participants only)", async () => {
    const interview = await env.models.Interview.findOne({ application: application._id, status: "confirmed" });
    const res = await env.api.get(`/api/interviews/${interview._id}/ics`).set(env.auth(seeker.token));
    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /text\/calendar/);
    assert.match(res.text, /BEGIN:VCALENDAR/);
    const stranger = await env.signup({ email: "i-stranger@test.com" });
    assert.equal((await env.api.get(`/api/interviews/${interview._id}/ics`).set(env.auth(stranger.token))).status, 403);
  });

  it("refuses to schedule over a confirmed interview until it is cancelled, then emails a cancellation", async () => {
    assert.equal((await env.api.post("/api/interviews").set(env.auth(employer.token)).send(proposeBody())).status, 409);

    env.clearMails();
    const interview = await env.models.Interview.findOne({ application: application._id, status: "confirmed" });
    assert.equal((await env.api.post(`/api/interviews/${interview._id}/cancel`).set(env.auth(seeker.token))).status, 403);
    const res = await env.api.post(`/api/interviews/${interview._id}/cancel`).set(env.auth(employer.token));
    assert.equal(res.status, 200);

    const mail = await env.waitForMail((m) => /i-seek@test.com/.test(m.to.text) && /cancelled/i.test(m.subject));
    const ics = mail.attachments.find((a) => /calendar/.test(a.contentType));
    assert.match(ics.content.toString(), /METHOD:CANCEL/);
    assert.equal((await env.api.post(`/api/interviews/${interview._id}/cancel`).set(env.auth(employer.token))).status, 409);
  });

  it("candidate can decline all slots with a reason and the employer is told", async () => {
    env.clearMails();
    const created = await env.api.post("/api/interviews").set(env.auth(employer.token)).send(proposeBody());
    const id = created.body.data._id;
    const res = await env.api.post(`/api/interviews/${id}/decline`).set(env.auth(seeker.token)).send({ reason: "I am travelling that week" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "declined");
    const mail = await env.waitForMail((m) => /i-emp@test.com/.test(m.to.text) && /declined/i.test(m.subject));
    assert.match(mail.text, /travelling/);
  });

  it("employer can mark a confirmed interview completed", async () => {
    const created = await env.api.post("/api/interviews").set(env.auth(employer.token)).send(proposeBody());
    const id = created.body.data._id;
    assert.equal((await env.api.post(`/api/interviews/${id}/complete`).set(env.auth(employer.token))).status, 409); // not confirmed yet
    await env.api.post(`/api/interviews/${id}/confirm`).set(env.auth(seeker.token)).send({ slotIndex: 0 });
    const res = await env.api.post(`/api/interviews/${id}/complete`).set(env.auth(employer.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "completed");
  });
});
