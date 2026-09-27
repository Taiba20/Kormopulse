import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";

// mongodb-memory-server defaults to a dbPath under the OS temp directory (usually the system
// drive). On a machine where that drive is nearly full, mongod fails to start with a low-level
// "fassert() failure" rather than a clear disk-space error. Giving each instance its own dbPath
// next to the project avoids that, independently of how full the OS temp drive is.
const TMP_ROOT = path.join(process.cwd(), ".tmp-tests");

/**
 * Boots an isolated environment for one test file: in-memory MongoDB, a fake SMTP server that
 * records every email, and the real Express app (optionally with Socket.io on a real port).
 */
export const startTestEnv = async ({ socket = false, env = {} } = {}) => {
  const dbPath = path.join(TMP_ROOT, `mongo-${crypto.randomBytes(6).toString("hex")}`);
  fs.mkdirSync(dbPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({ instance: { dbPath } });

  const rawMails = [];
  const smtp = new SMTPServer({
    authOptional: true,
    allowInsecureAuth: true,
    disabledCommands: ["STARTTLS"],
    onAuth: (_auth, _session, cb) => cb(null, { user: 1 }),
    onData(stream, _session, cb) {
      let raw = "";
      stream.on("data", (chunk) => (raw += chunk));
      stream.on("end", () => {
        rawMails.push(raw);
        cb();
      });
    },
  });
  await new Promise((resolve) => smtp.listen(0, "127.0.0.1", resolve));

  Object.assign(process.env, {
    NODE_ENV: "test",
    MONGODB_URL: mongo.getUri(),
    ACCESS_TOKEN_SECRET: "test-access-secret-".repeat(3),
    ACCESS_TOKEN_EXPIRY: "1d",
    REFRESH_TOKEN_SECRET: "test-refresh-secret-".repeat(3),
    REFRESH_TOKEN_EXPIRY: "10d",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(smtp.server.address().port),
    SMTP_USER: "noreply@kormopulse.test",
    SMTP_PASS: "secret",
    CLIENT_URL: "http://localhost:5173",
    GROQ_API_KEY: "", // never call the real AI in tests
    REQUIRE_EMAIL_VERIFICATION: "",
    GOOGLE_CLIENT_ID: "test-client-id",
    ...env,
  });

  await mongoose.connect(process.env.MONGODB_URL, { dbName: "kormopulse_test" });

  const { app } = await import("../src/app.js");
  const models = {
    User: (await import("../src/models/user.model.js")).User,
    CompanyProfile: (await import("../src/models/companyProfile.model.js")).CompanyProfile,
    JobSeekerProfile: (await import("../src/models/jobSeekerProfile.model.js")).JobSeekerProfile,
    Job: (await import("../src/models/job.model.js")).Job,
    Application: (await import("../src/models/application.model.js")).Application,
    Notification: (await import("../src/models/notification.model.js")).Notification,
    Interview: (await import("../src/models/interview.model.js")).Interview,
    JobAlert: (await import("../src/models/jobAlert.model.js")).JobAlert,
    SavedSearch: (await import("../src/models/savedSearch.model.js")).SavedSearch,
    CompanyReview: (await import("../src/models/companyReview.model.js")).CompanyReview,
    Message: (await import("../src/models/message.model.js")).Message,
  };

  // Mongoose builds indexes (e.g. unique constraints) in the background after connecting.
  // Wait for them so tests that rely on a unique index rejecting a duplicate are not flaky.
  await Promise.all(Object.values(models).map((model) => model.init()));

  let server = null;
  let baseUrl = null;
  let socketModule = null;
  if (socket) {
    socketModule = await import("../src/socket.js");
    server = http.createServer(app);
    socketModule.initSocket(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }

  const api = request(app);
  let counter = 0;

  /** Registers an account through the public API and returns its token. */
  const signup = async ({ role = "jobSeeker", name, email, password = "secret12" } = {}) => {
    counter += 1;
    const body = {
      name: name || `Test ${role} ${counter}`,
      email: email || `${role}${counter}@test.com`,
      password,
      role,
    };
    const res = await api.post("/api/users/signup").send(body);
    if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
    return { ...body, token: res.body.data.accessToken, id: res.body.data.user._id, user: res.body.data.user };
  };

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  const makeEmployer = async ({ companyName = "Acme Ltd", ...rest } = {}) => {
    const account = await signup({ role: "employer", ...rest });
    const company = await models.CompanyProfile.create({ companyName, doneOnboarding: true });
    await models.User.updateOne({ _id: account.id }, { companyProfile: company._id });
    return { ...account, company };
  };

  const makeSeeker = async ({ skills = [], yearsOfExperience = "2", location = "Dhaka", primaryRole = "", ...rest } = {}) => {
    const account = await signup({ role: "jobSeeker", ...rest });
    const profile = await models.JobSeekerProfile.create({
      name: account.name,
      skills,
      yearsOfExperience,
      location,
      primaryRole,
    });
    await models.User.updateOne({ _id: account.id }, { jobSeekerProfile: profile._id });
    return { ...account, profile };
  };

  const makeJob = async (employer, overrides = {}) =>
    models.Job.create({
      title: "Backend Developer",
      description: "<p>Build APIs</p>",
      skills: ["Node.js", "MongoDB"],
      experience: { min: 1, max: 4 },
      salary: { min: 40000, max: 70000, currency: "BDT" },
      jobType: "full-time",
      workMode: "onsite",
      location: "Dhaka",
      category: "software-development",
      applicationDeadline: new Date(Date.now() + 30 * 86400000),
      company: employer.company._id,
      postedBy: employer.id,
      ...overrides,
    });

  const applyTo = async (seeker, job, body = { coverLetter: "Hello" }) => {
    const res = await api.post(`/api/jobs/apply/${job._id}`).set(auth(seeker.token)).send(body);
    if (res.status !== 200) throw new Error(`apply failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.data.application;
  };

  /** Parsed emails received so far. */
  const mails = async () => Promise.all(rawMails.map((raw) => simpleParser(raw)));

  /** Waits until an email matching the predicate arrives (emails are sent asynchronously). */
  const waitForMail = async (predicate, timeoutMs = 4000) => {
    const started = Date.now();
    for (;;) {
      const found = (await mails()).find(predicate);
      if (found) return found;
      if (Date.now() - started > timeoutMs) {
        const subjects = (await mails()).map((m) => `${m.to?.text} | ${m.subject}`);
        throw new Error(`No matching email within ${timeoutMs}ms. Received: ${JSON.stringify(subjects)}`);
      }
      await new Promise((r) => setTimeout(r, 60));
    }
  };

  const waitFor = async (fn, timeoutMs = 4000) => {
    const started = Date.now();
    for (;;) {
      const value = await fn();
      if (value) return value;
      if (Date.now() - started > timeoutMs) throw new Error("waitFor timed out");
      await new Promise((r) => setTimeout(r, 60));
    }
  };

  const clearMails = () => {
    rawMails.length = 0;
  };

  const stop = async () => {
    if (socketModule) await socketModule.closeSocket();
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
    await new Promise((resolve) => smtp.close(resolve));
    fs.rmSync(dbPath, { recursive: true, force: true });
  };

  return {
    app,
    api,
    models,
    baseUrl,
    signup,
    auth,
    makeEmployer,
    makeSeeker,
    makeJob,
    applyTo,
    mails,
    waitForMail,
    waitFor,
    clearMails,
    stop,
  };
};
