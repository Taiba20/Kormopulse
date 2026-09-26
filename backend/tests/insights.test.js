import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";
import { percentile } from "../src/controllers/insights.controller.js";
import { peakStageIndex } from "../src/controllers/analytics.controller.js";

let env;
before(async () => {
  env = await startTestEnv();
});
after(async () => {
  await env.stop();
});

describe("company reviews", () => {
  let employer, alice, bob;

  before(async () => {
    employer = await env.makeEmployer({ email: "rv-emp@test.com", companyName: "Review Corp" });
    alice = await env.makeSeeker({ email: "rv-alice@test.com", name: "Alice Anon" });
    bob = await env.makeSeeker({ email: "rv-bob@test.com", name: "Bob Open" });
  });

  const review = (rating, extra = {}) => ({ rating, title: "Solid place to work", pros: "Great team", cons: "Slow deploys", recommend: true, ...extra });
  const post = (who, body) => env.api.post(`/api/reviews/company/${employer.company._id}`).set(env.auth(who.token)).send(body);

  it("validates the review", async () => {
    assert.equal((await post(alice, review(0))).status, 400);
    assert.equal((await post(alice, review(6))).status, 400);
    assert.equal((await post(alice, review(4, { title: "x" }))).status, 400);
    assert.equal((await post(alice, { title: "No rating here" })).status, 400);
    assert.equal((await env.api.post(`/api/reviews/company/${"0".repeat(24)}`).set(env.auth(alice.token)).send(review(4))).status, 404);
  });

  it("blocks employers, including the company's own owner", async () => {
    assert.equal((await post(employer, review(5))).status, 403);
    const other = await env.makeEmployer({ email: "rv-other@test.com" });
    assert.equal((await post(other, review(5))).status, 403);
  });

  it("lets a seeker review once, keeps them anonymous by default and notifies the owner", async () => {
    const res = await post(alice, review(5, { jobTitle: "Engineer", employmentStatus: "current" }));
    assert.equal(res.status, 201);
    assert.equal((await post(alice, review(1))).status, 409);
    const note = await env.waitFor(() => env.models.Notification.findOne({ user: employer.id, type: "review" }));
    assert.match(note.message, /5-star/);
  });

  it("computes the summary and hides anonymous authors", async () => {
    await post(bob, review(3, { isAnonymous: false, recommend: false, title: "Mixed feelings" }));
    const res = await env.api.get(`/api/reviews/company/${employer.company._id}`);
    assert.equal(res.status, 200);
    const { summary, reviews, company } = res.body.data;
    assert.equal(company.companyName, "Review Corp");
    assert.equal(summary.count, 2);
    assert.equal(summary.average, 4);
    assert.equal(summary.recommendPercent, 50);
    assert.deepEqual(summary.distribution, { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 });

    const alicesView = reviews.find((r) => r.rating === 5);
    const bobsView = reviews.find((r) => r.rating === 3);
    assert.equal(alicesView.author, "Anonymous");
    assert.equal(bobsView.author, "Bob Open");
    assert.equal(JSON.stringify(res.body).includes("rv-alice@test.com"), false, "reviewer email must never be exposed");
  });

  it("flags the viewer's own review and supports sorting", async () => {
    const res = await env.api.get(`/api/reviews/company/${employer.company._id}?sort=lowest`).set(env.auth(alice.token));
    assert.deepEqual(res.body.data.reviews.map((r) => r.rating), [3, 5]);
    assert.equal(res.body.data.myReview.rating, 5);
    assert.equal(res.body.data.reviews.find((r) => r.rating === 5).isMine, true);
    const anon = await env.api.get(`/api/reviews/company/${employer.company._id}`);
    assert.equal(anon.body.data.myReview, null);
  });

  it("shows ratings on the companies list", async () => {
    const res = await env.api.get("/api/jobs/companies");
    const row = res.body.data.find((c) => c.companyName === "Review Corp");
    assert.deepEqual(row.rating, { average: 4, count: 2 });
    const unrated = res.body.data.find((c) => c.rating.count === 0);
    assert.ok(!unrated || unrated.rating.average === 0);
  });

  it("only the author can edit; author or admin can delete", async () => {
    const mine = await env.models.CompanyReview.findOne({ user: alice.id });
    assert.equal((await env.api.put(`/api/reviews/${mine._id}`).set(env.auth(bob.token)).send({ rating: 1 })).status, 404);
    const edited = await env.api.put(`/api/reviews/${mine._id}`).set(env.auth(alice.token)).send({ rating: 4, title: "Edited headline" });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.data.rating, 4);
    assert.equal((await env.api.delete(`/api/reviews/${mine._id}`).set(env.auth(bob.token))).status, 404);

    const admin = await env.signup({ email: "rv-admin@test.com" });
    await env.models.User.updateOne({ _id: admin.id }, { role: "admin" });
    const bobs = await env.models.CompanyReview.findOne({ user: bob.id });
    assert.equal((await env.api.delete(`/api/reviews/${bobs._id}`).set(env.auth(admin.token))).status, 200);
    assert.equal((await env.api.delete(`/api/reviews/${mine._id}`).set(env.auth(alice.token))).status, 200);
    assert.equal(await env.models.CompanyReview.countDocuments({ company: employer.company._id }), 0);
  });

  it("serves a public company page with jobs and rating", async () => {
    await env.makeJob(employer, { title: "Open role" });
    await env.makeJob(employer, { title: "Closed role", isActive: false });
    const res = await env.api.get(`/api/jobs/company/${employer.company._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.company.companyName, "Review Corp");
    assert.deepEqual(res.body.data.jobs.map((j) => j.title), ["Open role"]);
    assert.equal(res.body.data.rating.count, 0);
    assert.equal((await env.api.get(`/api/jobs/company/${"0".repeat(24)}`)).status, 404);
    assert.equal((await env.api.get("/api/jobs/company/nope")).status, 400);
  });
});

describe("salary insights", () => {
  it("computes percentiles correctly (unit)", () => {
    assert.equal(percentile([], 0.5), 0);
    assert.equal(percentile([10], 0.9), 10);
    assert.equal(percentile([10, 20, 30, 40], 0.5), 25);
    assert.equal(percentile([10, 20, 30, 40, 50], 0.25), 20);
  });

  before(async () => {
    await env.models.Job.deleteMany({}); // start from a clean slate: other suites also create jobs
    const employer = await env.makeEmployer({ email: "si-emp@test.com", companyName: "Pay Corp" });
    const jobs = [
      { title: "Frontend Developer", salary: { min: 30000, max: 50000, currency: "BDT" }, experience: { min: 0, max: 2 }, category: "software-development", location: "Dhaka" },
      { title: "Frontend Developer", salary: { min: 50000, max: 70000, currency: "BDT" }, experience: { min: 2, max: 4 }, category: "software-development", location: "Dhaka" },
      { title: "Frontend Developer", salary: { min: 70000, max: 110000, currency: "BDT" }, experience: { min: 5, max: 8 }, category: "software-development", location: "Chattogram" },
      { title: "Accountant", salary: { min: 25000, max: 35000, currency: "BDT" }, experience: { min: 1, max: 3 }, category: "finance", location: "Dhaka" },
      { title: "Remote Engineer", salary: { min: 2000, max: 3000, currency: "USD" }, experience: { min: 1, max: 3 }, category: "software-development", location: "Remote" },
      { title: "Unpriced Job", salary: { min: 0, max: 0, currency: "BDT" }, experience: { min: 1, max: 3 }, category: "other", location: "Dhaka" },
    ];
    for (const j of jobs) await env.makeJob(employer, j);
  });

  it("aggregates BDT salaries, ignoring unpriced jobs and other currencies", async () => {
    const res = await env.api.get("/api/jobs/salary-insights");
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.equal(d.currency, "BDT");
    assert.equal(d.sampleSize, 4);
    assert.ok(d.overall.p25 <= d.overall.median && d.overall.median <= d.overall.p75);
    assert.equal(d.overall.avgMin, Math.round((30000 + 50000 + 70000 + 25000) / 4));
    assert.equal(d.overall.avgMax, Math.round((50000 + 70000 + 110000 + 35000) / 4));

    const software = d.byCategory.find((c) => c.key === "software-development");
    assert.equal(software.count, 3);
    assert.deepEqual(d.byExperience.map((b) => b.key), ["0-1 yrs", "1-3 yrs", "3-5 yrs", "5+ yrs"].filter((k) => d.byExperience.some((b) => b.key === k)));
    assert.equal(d.byLocation[0].key, "Dhaka");
    assert.equal(d.topTitles[0].key, "frontend developer");
  });

  it("filters by title, location and currency", async () => {
    const t = (await env.api.get("/api/jobs/salary-insights?title=frontend")).body.data;
    assert.equal(t.sampleSize, 3);
    const l = (await env.api.get("/api/jobs/salary-insights?location=dhaka&title=frontend")).body.data;
    assert.equal(l.sampleSize, 2);
    assert.equal(l.overall.median, 50000);
    const usd = (await env.api.get("/api/jobs/salary-insights?currency=USD")).body.data;
    assert.equal(usd.sampleSize, 1);
    const any = (await env.api.get("/api/jobs/salary-insights?currency=any")).body.data;
    assert.equal(any.sampleSize, 5);
    const none = (await env.api.get("/api/jobs/salary-insights?title=astronaut")).body.data;
    assert.equal(none.sampleSize, 0);
    assert.equal(none.overall.median, 0);
  });

  it("is safe against regex injection in filters", async () => {
    const res = await env.api.get("/api/jobs/salary-insights").query({ title: "(((", location: ".*[" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.sampleSize, 0);
  });
});

describe("employer analytics", () => {
  let employer, job1, job2;

  before(async () => {
    employer = await env.makeEmployer({ email: "an-emp@test.com" });
    job1 = await env.makeJob(employer, { title: "Analytics Job 1", viewCount: 100 });
    job2 = await env.makeJob(employer, { title: "Analytics Job 2", viewCount: 20 });

    const seekers = [];
    for (let i = 0; i < 5; i++) seekers.push(await env.makeSeeker({ email: `an-s${i}@test.com` }));
    const apps = [];
    for (let i = 0; i < 4; i++) apps.push(await env.applyTo(seekers[i], job1));
    apps.push(await env.applyTo(seekers[4], job2));

    const move = (app, status) => env.api.patch(`/api/applications/${app._id}/status`).set(env.auth(employer.token)).send({ status });
    await move(apps[0], "reviewed");
    await move(apps[0], "shortlisted");
    await move(apps[0], "interview");
    await move(apps[0], "hired");
    await move(apps[1], "shortlisted");
    await move(apps[1], "rejected");
    await move(apps[2], "reviewed");

    // Make the hire take exactly 3 days
    const hired = await env.models.Application.findById(apps[0]._id);
    const appliedAt = new Date(Date.now() - 3 * 86400000);
    hired.appliedAt = appliedAt;
    await hired.save();
  });

  it("computes the funnel, summary and per-job conversion", async () => {
    const res = await env.api.get("/api/company/analytics?days=30").set(env.auth(employer.token));
    assert.equal(res.status, 200);
    const d = res.body.data;

    assert.equal(d.summary.totalJobs, 2);
    assert.equal(d.summary.activeJobs, 2);
    assert.equal(d.summary.totalViews, 120);
    assert.equal(d.summary.totalApplications, 5);
    assert.equal(d.summary.hires, 1);
    assert.equal(d.summary.avgApplicationsPerJob, 2.5);
    assert.equal(d.summary.conversionPercent, 4.2);
    assert.ok(Math.abs(d.summary.avgTimeToHireDays - 3) < 0.1, `time to hire was ${d.summary.avgTimeToHireDays}`);

    // Everyone applied; reviewed: apps 0,1,2 (1 via shortlist); shortlisted: 0,1; interview: 0; hired: 0
    assert.deepEqual(d.funnel.map((f) => f.count), [5, 3, 2, 1, 1]);
    assert.deepEqual(d.funnel.map((f) => f.label), ["Applied", "Reviewed", "Shortlisted", "Interview", "Hired"]);
    assert.equal(d.rejected, 1);

    const status = Object.fromEntries(d.statusBreakdown.map((s) => [s.status, s.count]));
    assert.deepEqual(status, { pending: 2, reviewed: 1, shortlisted: 0, interview: 0, hired: 1, rejected: 1 });

    assert.equal(d.applicationsOverTime.length, 30);
    assert.equal(d.applicationsOverTime.reduce((sum, p) => sum + p.count, 0), 5);

    const top = d.topJobs[0];
    assert.equal(top.title, "Analytics Job 1");
    assert.equal(top.applications, 4);
    assert.equal(top.conversionPercent, 4);
    assert.equal(top.hires, 1);
  });

  it("clamps the range and restricts access to employers", async () => {
    assert.equal((await env.api.get("/api/company/analytics?days=9999").set(env.auth(employer.token))).body.data.applicationsOverTime.length, 365);
    assert.equal((await env.api.get("/api/company/analytics?days=1").set(env.auth(employer.token))).body.data.applicationsOverTime.length, 7);
    const seeker = await env.signup({ email: "an-notemp@test.com" });
    assert.equal((await env.api.get("/api/company/analytics").set(env.auth(seeker.token))).status, 403);
    assert.equal((await env.api.get("/api/company/analytics")).status, 401);
  });

  it("only counts the employer's own jobs", async () => {
    const empty = await env.makeEmployer({ email: "an-empty@test.com" });
    const d = (await env.api.get("/api/company/analytics").set(env.auth(empty.token))).body.data;
    assert.equal(d.summary.totalApplications, 0);
    assert.equal(d.summary.avgTimeToHireDays, 0);
    assert.deepEqual(d.funnel.map((f) => f.count), [0, 0, 0, 0, 0]);
  });

  it("peakStageIndex keeps a rejected candidate's furthest stage (unit)", () => {
    assert.equal(peakStageIndex({ status: "rejected", statusHistory: [{ status: "pending" }, { status: "interview" }, { status: "rejected" }] }), 3);
    assert.equal(peakStageIndex({ status: "pending", statusHistory: [] }), 0);
  });
});
