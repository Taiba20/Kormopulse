import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";

let env;
let admin;
const asAdmin = (req) => req.set(env.auth(admin.token));

before(async () => {
  env = await startTestEnv();
  admin = await env.signup({ email: "root-admin@test.com", name: "Root Admin" });
  await env.models.User.updateOne({ _id: admin.id }, { role: "admin" });
});
after(async () => {
  await env.stop();
});

describe("admin access control", () => {
  it("rejects anonymous users, job seekers and employers on every admin route", async () => {
    const seeker = await env.signup({ email: "ac-seek@test.com" });
    const employer = await env.makeEmployer({ email: "ac-emp@test.com" });
    const routes = [
      ["get", "/api/admin/stats"],
      ["get", "/api/admin/users"],
      ["get", "/api/admin/jobs"],
      ["get", "/api/admin/reviews"],
      ["post", "/api/admin/run-job-alerts"],
      ["patch", `/api/admin/users/${seeker.id}/suspend`],
      ["delete", `/api/admin/users/${seeker.id}`],
    ];
    for (const [method, url] of routes) {
      assert.equal((await env.api[method](url)).status, 401, `anon ${method} ${url}`);
      assert.equal((await env.api[method](url).set(env.auth(seeker.token))).status, 403, `seeker ${method} ${url}`);
      assert.equal((await env.api[method](url).set(env.auth(employer.token))).status, 403, `employer ${method} ${url}`);
    }
    // ...and the victim is untouched
    assert.ok(await env.models.User.findById(seeker.id));
  });
});

describe("platform statistics", () => {
  before(async () => {
    const employer = await env.makeEmployer({ email: "st-emp@test.com", companyName: "Stat Corp" });
    const seeker = await env.makeSeeker({ email: "st-seek@test.com" });
    const job = await env.makeJob(employer, { category: "finance" });
    await env.applyTo(seeker, job);
    await env.models.User.updateOne({ _id: seeker.id }, { isSuspended: true });
  });

  it("returns totals, breakdowns and gap-free daily series", async () => {
    const res = await asAdmin(env.api.get("/api/admin/stats?days=14"));
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.equal(d.rangeDays, 14);
    assert.equal(d.totals.admins, 1);
    assert.equal(d.totals.employers, 1 + 1); // ac-emp from the previous suite + st-emp
    assert.equal(d.totals.jobSeekers, 2);
    assert.equal(d.totals.suspended, 1);
    assert.equal(d.totals.jobs, 1);
    assert.equal(d.totals.activeJobs, 1);
    assert.equal(d.totals.applications, 1);
    assert.deepEqual(d.applicationsByStatus, [{ status: "pending", count: 1 }]);
    assert.deepEqual(d.jobsByCategory, [{ category: "finance", count: 1 }]);
    assert.deepEqual(d.topCompanies, [{ name: "Stat Corp", applications: 1, jobs: 1 }]);

    for (const key of ["signups", "jobs", "applications"]) {
      assert.equal(d.series[key].length, 14, key);
      const dates = d.series[key].map((p) => p.date);
      assert.equal(new Set(dates).size, 14);
      assert.deepEqual([...dates].sort(), dates);
    }
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(d.series.signups.at(-1).date, today);
    assert.equal(d.series.signups.reduce((s, p) => s + p.count, 0), d.totals.users);
    assert.equal(d.series.applications.at(-1).count, 1);
  });

  it("clamps the range", async () => {
    assert.equal((await asAdmin(env.api.get("/api/admin/stats?days=1"))).body.data.series.signups.length, 7);
    assert.equal((await asAdmin(env.api.get("/api/admin/stats?days=1000"))).body.data.series.signups.length, 90);
  });
});

describe("user moderation", () => {
  it("searches, filters and paginates users", async () => {
    for (let i = 0; i < 3; i++) await env.signup({ email: `um-page${i}@test.com`, name: `Pager ${i}` });
    const search = await asAdmin(env.api.get("/api/admin/users?search=pager"));
    assert.equal(search.body.data.users.length, 3);
    assert.equal(search.body.data.pagination.total, 3);

    const page = await asAdmin(env.api.get("/api/admin/users?search=pager&limit=2&page=2"));
    assert.equal(page.body.data.users.length, 1);
    assert.equal(page.body.data.pagination.totalPages, 2);

    const admins = await asAdmin(env.api.get("/api/admin/users?role=admin"));
    assert.deepEqual(admins.body.data.users.map((u) => u.email), ["root-admin@test.com"]);

    const suspended = await asAdmin(env.api.get("/api/admin/users?status=suspended"));
    assert.ok(suspended.body.data.users.every((u) => u.isSuspended));
    const active = await asAdmin(env.api.get("/api/admin/users?status=active&limit=100"));
    assert.ok(active.body.data.users.every((u) => !u.isSuspended));

    // Never leaks credentials
    assert.equal(JSON.stringify(search.body).includes("password"), false);
    // Regex characters in search are treated literally
    assert.equal((await asAdmin(env.api.get("/api/admin/users?search=(((["))).status, 200);
  });

  it("suspends a user (blocking login) and reinstates them", async () => {
    const user = await env.signup({ email: "um-target@test.com" });
    const res = await asAdmin(env.api.patch(`/api/admin/users/${user.id}/suspend`)).send({ suspended: true, reason: "Spam" });
    assert.equal(res.status, 200);
    assert.equal((await env.api.post("/api/users/login").send({ email: user.email, password: user.password })).status, 403);
    assert.equal((await env.api.get("/api/users/current-user").set(env.auth(user.token))).status, 403);
    assert.equal((await env.models.User.findById(user.id)).suspendedReason, "Spam");

    await asAdmin(env.api.patch(`/api/admin/users/${user.id}/suspend`)).send({ suspended: false });
    assert.equal((await env.api.post("/api/users/login").send({ email: user.email, password: user.password })).status, 200);
    await env.waitFor(() => env.models.Notification.findOne({ user: user.id, title: "Account restored" }));
  });

  it("protects admins and the acting admin, and validates input", async () => {
    const other = await env.signup({ email: "um-admin2@test.com" });
    await env.models.User.updateOne({ _id: other.id }, { role: "admin" });
    const suspend = (id, body = { suspended: true }) => asAdmin(env.api.patch(`/api/admin/users/${id}/suspend`)).send(body);

    assert.equal((await suspend(admin.id)).status, 400); // self
    assert.equal((await suspend(other.id)).status, 403); // another admin
    assert.equal((await asAdmin(env.api.delete(`/api/admin/users/${admin.id}`))).status, 400);
    assert.equal((await asAdmin(env.api.delete(`/api/admin/users/${other.id}`))).status, 403);
    assert.equal((await suspend("0".repeat(24))).status, 404);
    assert.equal((await suspend("nope")).status, 400);
    assert.equal((await suspend((await env.signup({ email: "um-v@test.com" })).id, { suspended: "yes" })).status, 400);
  });

  it("deleting an employer removes their jobs, applications, company, reviews and notifications", async () => {
    const employer = await env.makeEmployer({ email: "del-emp@test.com", companyName: "Doomed Inc" });
    const seeker = await env.makeSeeker({ email: "del-seek@test.com" });
    const job = await env.makeJob(employer);
    const application = await env.applyTo(seeker, job);
    await env.models.CompanyReview.create({ company: employer.company._id, user: seeker.id, rating: 4, title: "Good enough" });
    await env.waitFor(() => env.models.Notification.findOne({ user: employer.id }));
    await env.models.Interview.create({ application: application._id, job: job._id, employer: employer.id, candidate: seeker.id, slots: [new Date(Date.now() + 86400000)] });

    const res = await asAdmin(env.api.delete(`/api/admin/users/${employer.id}`));
    assert.equal(res.status, 200);

    assert.equal(await env.models.User.findById(employer.id), null);
    assert.equal(await env.models.Job.findById(job._id), null);
    assert.equal(await env.models.Application.countDocuments({ job: job._id }), 0);
    assert.equal(await env.models.CompanyProfile.findById(employer.company._id), null);
    assert.equal(await env.models.CompanyReview.countDocuments({ company: employer.company._id }), 0);
    assert.equal(await env.models.Notification.countDocuments({ user: employer.id }), 0);
    assert.equal(await env.models.Interview.countDocuments({ employer: employer.id }), 0);
    assert.ok(await env.models.User.findById(seeker.id), "the applicant must not be deleted");
  });

  it("deleting a job seeker removes their applications, alerts, reviews, profile and embedded traces", async () => {
    const employer = await env.makeEmployer({ email: "del2-emp@test.com" });
    const seeker = await env.makeSeeker({ email: "del2-seek@test.com" });
    const job = await env.makeJob(employer);
    await env.applyTo(seeker, job);
    await env.models.JobAlert.create({ user: seeker.id, keyword: "x" });
    await env.models.Message.create({ from: employer.id, to: seeker.id, subject: "Hi", content: "Hello" });

    assert.equal((await asAdmin(env.api.delete(`/api/admin/users/${seeker.id}`))).status, 200);

    assert.equal(await env.models.Application.countDocuments({ applicant: seeker.id }), 0);
    assert.equal(await env.models.JobAlert.countDocuments({ user: seeker.id }), 0);
    assert.equal(await env.models.JobSeekerProfile.findById(seeker.profile._id), null);
    assert.equal(await env.models.Message.countDocuments({ to: seeker.id }), 0);
    const stored = await env.models.Job.findById(job._id);
    assert.equal(stored.applicants.length, 0);
    assert.ok(stored, "the job itself remains");
  });
});

describe("job and review moderation", () => {
  let employer, job;
  before(async () => {
    employer = await env.makeEmployer({ email: "jm-emp@test.com", companyName: "Moderated Ltd" });
    job = await env.makeJob(employer, { title: "Suspicious Offer" });
    await env.makeJob(employer, { title: "Legit Role", isActive: false });
  });

  it("lists and filters jobs with company and poster", async () => {
    const all = await asAdmin(env.api.get("/api/admin/jobs?search=suspicious"));
    assert.equal(all.body.data.jobs.length, 1);
    assert.equal(all.body.data.jobs[0].company.companyName, "Moderated Ltd");
    assert.equal(all.body.data.jobs[0].postedBy.email, "jm-emp@test.com");
    const inactive = await asAdmin(env.api.get("/api/admin/jobs?status=inactive"));
    assert.ok(inactive.body.data.jobs.every((j) => j.isActive === false));
  });

  it("deactivates a job and tells the employer, then reactivates it", async () => {
    const off = await asAdmin(env.api.patch(`/api/admin/jobs/${job._id}/status`)).send({ isActive: false });
    assert.equal(off.status, 200);
    assert.equal((await env.models.Job.findById(job._id)).isActive, false);
    const note = await env.waitFor(() => env.models.Notification.findOne({ user: employer.id, title: /deactivated/ }));
    assert.match(note.message, /Suspicious Offer/);
    await asAdmin(env.api.patch(`/api/admin/jobs/${job._id}/status`)).send({ isActive: true });
    assert.equal((await env.models.Job.findById(job._id)).isActive, true);
    assert.equal((await asAdmin(env.api.patch(`/api/admin/jobs/${job._id}/status`)).send({ isActive: "maybe" })).status, 400);
    assert.equal((await asAdmin(env.api.patch(`/api/admin/jobs/${"0".repeat(24)}/status`)).send({ isActive: true })).status, 404);
  });

  it("deletes a job together with its applications", async () => {
    const seeker = await env.makeSeeker({ email: "jm-seek@test.com" });
    await env.applyTo(seeker, job);
    assert.equal((await asAdmin(env.api.delete(`/api/admin/jobs/${job._id}`))).status, 200);
    assert.equal(await env.models.Application.countDocuments({ job: job._id }), 0);
    assert.equal((await asAdmin(env.api.delete(`/api/admin/jobs/${job._id}`))).status, 404);
  });

  it("lists reviews for moderation and runs alerts on demand", async () => {
    const seeker = await env.makeSeeker({ email: "jm-rev@test.com" });
    await env.models.CompanyReview.create({ company: employer.company._id, user: seeker.id, rating: 1, title: "Terrible", isAnonymous: true });
    const res = await asAdmin(env.api.get("/api/admin/reviews"));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.reviews[0].company.companyName, "Moderated Ltd");
    assert.equal(res.body.data.reviews[0].user.email, "jm-rev@test.com"); // admins can see who wrote it

    const alerts = await asAdmin(env.api.post("/api/admin/run-job-alerts"));
    assert.equal(alerts.status, 200);
    assert.deepEqual(Object.keys(alerts.body.data).sort(), ["checked", "jobsReported"]);
  });
});
