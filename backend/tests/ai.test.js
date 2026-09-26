import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import PDFDocument from "pdfkit";
import JSZip from "jszip";
import { startTestEnv } from "./helpers.js";

let env;
let ai;

before(async () => {
  env = await startTestEnv();
  ai = await import("../src/services/ai.service.js");
});
after(async () => {
  ai.setCompletionFn(null);
  await env.stop();
});

const RESUME = `Tasnim Ahmed
Dhaka, Bangladesh
tasnim.ahmed@example.com | +880 1712-345678
github.com/tasnimdev | linkedin.com/in/tasnim-ahmed

Summary
Full-stack developer with 4 years of experience building web applications.

Experience
Software Engineer at BrightTech Ltd  2021 - Present
Built REST APIs with Node.js and MongoDB.
Junior Developer at PixelWorks  2019 - 2021
Developed React front-ends.

Education
B.Sc. in Computer Science, BRAC University  2015 - 2019

Skills
JavaScript, TypeScript, React, Node.js, MongoDB, Docker, Git, SQL, C++
`;

const makePdf = (text) =>
  new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(11).text(text);
    doc.end();
  });

const makeDocx = async (text) => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  );
  const paragraphs = text
    .split("\n")
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`)
    .join("");
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`
  );
  return zip.generateAsync({ type: "nodebuffer" });
};

describe("rule-based resume parsing (no AI key configured)", () => {
  let seeker;
  before(async () => {
    seeker = await env.makeSeeker({ email: "ai-seek@test.com", name: "Tasnim Ahmed", skills: [], yearsOfExperience: "" });
  });

  const upload = (buffer, filename) =>
    env.api.post("/api/ai/resume/parse").set(env.auth(seeker.token)).attach("resume", buffer, filename);

  it("extracts the profile from a PDF", async () => {
    const res = await upload(await makePdf(RESUME), "resume.pdf");
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const { source, profile, aiConfigured } = res.body.data;
    assert.equal(source, "rules");
    assert.equal(aiConfigured, false);
    assert.equal(profile.name, "Tasnim Ahmed");
    assert.equal(profile.email, "tasnim.ahmed@example.com");
    assert.match(profile.contactNumber, /1712/);
    assert.equal(profile.socialProfiles.github, "https://github.com/tasnimdev");
    assert.equal(profile.socialProfiles.linkedIn, "https://linkedin.com/in/tasnim-ahmed");
    for (const skill of ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "Docker", "Git", "SQL", "C++"]) {
      assert.ok(profile.skills.includes(skill), `missing skill ${skill}`);
    }
    assert.ok(!profile.skills.includes("Java"), "JavaScript must not also match Java");
    assert.ok(!profile.skills.includes("C"), "C++ must not also match C");
    assert.equal(profile.yearsOfExperience, "4");
    assert.match(profile.bio, /Full-stack developer/);
    assert.equal(profile.education[0].institution, "BRAC University");
    assert.match(profile.education[0].degree, /B\.?Sc/);
    assert.equal(profile.education[0].startYear, 2015);
    assert.equal(profile.education[0].endYear, 2019);

    assert.equal(profile.workExperience.length, 2);
    assert.equal(profile.workExperience[0].jobTitle, "Software Engineer");
    assert.equal(profile.workExperience[0].company.name, "BrightTech Ltd");
    assert.equal(profile.workExperience[0].currentJob, true);
    assert.equal(profile.workExperience[1].jobTitle, "Junior Developer");
    assert.equal(profile.workExperience[1].endMonth, "2021-12");
    assert.equal(profile.primaryRole, "Software Engineer");
  });

  it("reads DOCX and TXT resumes", async () => {
    const docx = await upload(await makeDocx(RESUME), "resume.docx");
    assert.equal(docx.status, 200, JSON.stringify(docx.body));
    assert.equal(docx.body.data.profile.email, "tasnim.ahmed@example.com");
    assert.ok(docx.body.data.profile.skills.includes("MongoDB"));

    const txt = await upload(Buffer.from(RESUME), "resume.txt");
    assert.equal(txt.status, 200);
    assert.equal(txt.body.data.profile.name, "Tasnim Ahmed");
  });

  it("rejects unsupported, empty, corrupt and oversized files with helpful errors", async () => {
    assert.equal((await upload(Buffer.from("MZ..."), "virus.exe")).status, 400);
    const doc = await upload(Buffer.from("old word file"), "resume.doc");
    assert.equal(doc.status, 400);

    const empty = await upload(Buffer.from("   "), "empty.txt");
    assert.equal(empty.status, 422);
    assert.match(empty.body.message, /couldn't read any text/i);

    const corrupt = await upload(Buffer.from("this is not really a pdf at all, just some text"), "broken.pdf");
    assert.equal(corrupt.status, 422);

    const big = await upload(Buffer.alloc(5 * 1024 * 1024 + 10, "a"), "big.txt");
    assert.equal(big.status, 400);
    assert.equal(big.body.error, "FILE_TOO_LARGE");

    const none = await env.api.post("/api/ai/resume/parse").set(env.auth(seeker.token));
    assert.equal(none.status, 400);
  });

  it("is restricted to job seekers", async () => {
    const employer = await env.makeEmployer({ email: "ai-emp@test.com" });
    assert.equal((await env.api.post("/api/ai/resume/parse").set(env.auth(employer.token)).attach("resume", Buffer.from(RESUME), "r.txt")).status, 403);
    assert.equal((await env.api.post("/api/ai/resume/parse").attach("resume", Buffer.from(RESUME), "r.txt")).status, 401);
  });
});

describe("AI-assisted parsing (fake model)", () => {
  let seeker;
  before(async () => {
    seeker = await env.makeSeeker({ email: "ai2-seek@test.com", name: "Tasnim Ahmed" });
  });

  it("uses the model output, sanitises it, and fills gaps from the rule-based pass", async () => {
    ai.setCompletionFn(async ({ json }) => {
      assert.equal(json, true);
      return JSON.stringify({
        name: "Tasnim Ahmed",
        bio: "  Builds things.  ",
        yearsOfExperience: "seven",
        primaryRole: "Platform Engineer",
        skills: ["Kubernetes", "kubernetes", { name: "Go" }, 42, ""],
        education: [{ institution: "BRAC University", degree: "BSc", startYear: "2015-09", endYear: 3000 }, {}],
        workExperience: [{ title: "Platform Engineer", company: "Cloud Co", startDate: "2020-3", endDate: "Present" }],
        linkedin: "https://linkedin.com/in/from-model",
        injected: "<script>alert(1)</script>",
      });
    });
    const res = await env.api.post("/api/ai/resume/parse").set(env.auth(seeker.token)).attach("resume", Buffer.from(RESUME), "resume.txt");
    assert.equal(res.status, 200);
    const { source, profile } = res.body.data;
    assert.equal(source, "ai");
    assert.equal(profile.bio, "Builds things.");
    assert.equal(profile.yearsOfExperience, "0"); // "seven" is not a number: never guess
    assert.deepEqual(profile.skills, ["Kubernetes", "Go"]);
    assert.equal(profile.education.length, 1);
    assert.equal(profile.education[0].startYear, 2015);
    assert.equal(profile.education[0].endYear, undefined); // implausible year dropped
    assert.equal(profile.workExperience[0].startMonth, "2020-03");
    assert.equal(profile.workExperience[0].currentJob, true);
    assert.equal(profile.workExperience[0].endMonth, undefined);
    assert.equal(profile.socialProfiles.linkedIn, "https://linkedin.com/in/from-model");
    assert.equal(profile.email, "tasnim.ahmed@example.com"); // filled from rules
    assert.equal(profile.socialProfiles.github, "https://github.com/tasnimdev");
    assert.equal("injected" in profile, false);
  });

  it("falls back to rules when the model fails or returns garbage", async () => {
    ai.setCompletionFn(async () => {
      throw new Error("Groq is down");
    });
    let res = await env.api.post("/api/ai/resume/parse").set(env.auth(seeker.token)).attach("resume", Buffer.from(RESUME), "resume.txt");
    assert.equal(res.body.data.source, "rules");
    assert.ok(res.body.data.profile.skills.includes("React"));

    ai.setCompletionFn(async () => "Sorry, I cannot help with that.");
    res = await env.api.post("/api/ai/resume/parse").set(env.auth(seeker.token)).attach("resume", Buffer.from(RESUME), "resume.txt");
    assert.equal(res.body.data.source, "rules");
    ai.setCompletionFn(null);
  });
});

describe("applying a parsed resume to the profile", () => {
  const parsed = () => ({
    bio: "Full-stack developer",
    primaryRole: "Software Engineer",
    contactNumber: "+8801712345678",
    location: "Dhaka",
    yearsOfExperience: "4",
    skills: ["React", "Node.js", "Docker"],
    education: [{ institution: "BRAC University", degree: "B.Sc.", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 }],
    workExperience: [{ jobTitle: "Software Engineer", company: { name: "BrightTech Ltd" }, startMonth: "2021-01", currentJob: true, description: "APIs" }],
    socialProfiles: { github: "https://github.com/tasnimdev" },
  });

  it("creates the profile when missing, and mirrors it for the UI", async () => {
    const fresh = await env.signup({ email: "ap-fresh@test.com", name: "Fresh User" });
    const res = await env.api.post("/api/ai/resume/apply").set(env.auth(fresh.token)).send({ profile: parsed() });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const { user } = res.body.data;
    assert.deepEqual(user.jobSeekerProfile.skills, ["React", "Node.js", "Docker"]);
    assert.equal(user.jobSeekerProfile.name, "Fresh User");
    assert.equal(user.jobSeekerProfile.workExperience[0].jobTitle, "Software Engineer");
    assert.equal(user.jobSeekerProfile.education[0].institution, "BRAC University");
    // The app also reads the legacy mirrored copy
    assert.deepEqual(user.userProfile.skills, ["React", "Node.js", "Docker"]);
    assert.equal(user.userProfile.primaryRole, "Software Engineer");
    assert.equal(user.userProfile.socialProfiles.github, "https://github.com/tasnimdev");
  });

  it("merges without duplicating or overwriting existing data", async () => {
    const seeker = await env.makeSeeker({ email: "ap-merge@test.com", skills: ["react", "Python"], yearsOfExperience: "9", primaryRole: "Data Scientist" });
    await env.models.JobSeekerProfile.updateOne(
      { _id: seeker.profile._id },
      { $push: { education: { institution: "brac university", degree: "b.sc." }, workExperience: { jobTitle: "software engineer", company: { name: "brighttech ltd" } } }, bio: "My own bio" }
    );

    const send = (overwrite) => env.api.post("/api/ai/resume/apply").set(env.auth(seeker.token)).send({ profile: parsed(), overwrite });
    const res = await send(false);
    assert.equal(res.status, 200);
    const p = res.body.data.user.jobSeekerProfile;
    assert.deepEqual(p.skills.map((s) => s.toLowerCase()).sort(), ["docker", "node.js", "python", "react"]);
    assert.equal(p.education.length, 1);
    assert.equal(p.workExperience.length, 1);
    assert.equal(p.bio, "My own bio");
    assert.equal(p.primaryRole, "Data Scientist");
    assert.equal(p.yearsOfExperience, "9");
    assert.equal(p.location, "Dhaka"); // was empty, so it is filled

    // Idempotent
    const again = await send(false);
    assert.equal(again.body.data.user.jobSeekerProfile.skills.length, 4);

    const forced = await send(true);
    assert.equal(forced.body.data.user.jobSeekerProfile.bio, "Full-stack developer");
    assert.equal(forced.body.data.user.jobSeekerProfile.primaryRole, "Software Engineer");
  });

  it("sanitises hostile payloads", async () => {
    const seeker = await env.makeSeeker({ email: "ap-evil@test.com" });
    const evil = { bio: "x".repeat(5000), skills: Array.from({ length: 200 }, (_, i) => `skill${i}`), isAdmin: true, role: "admin", education: "not-an-array" };
    const res = await env.api.post("/api/ai/resume/apply").set(env.auth(seeker.token)).send({ profile: evil });
    assert.equal(res.status, 200);
    const p = res.body.data.user.jobSeekerProfile;
    assert.equal(p.bio.length, 600);
    assert.equal(p.skills.length, 40);
    assert.equal(res.body.data.user.role, "jobSeeker");
    assert.equal((await env.api.post("/api/ai/resume/apply").set(env.auth(seeker.token)).send({})).status, 400);
  });
});

describe("cover letters and interview prep", () => {
  let employer, seeker, job;
  before(async () => {
    employer = await env.makeEmployer({ email: "cl-emp@test.com", companyName: "Letter Corp" });
    seeker = await env.makeSeeker({ email: "cl-seek@test.com", name: "Lena Writer", skills: ["Node.js", "MongoDB", "Docker"], yearsOfExperience: "3", primaryRole: "Backend Developer" });
    job = await env.makeJob(employer, { title: "Senior Node Engineer", skills: ["Node.js", "MongoDB", "Kubernetes"], description: "<p>Own our <b>API platform</b></p>" });
  });

  it("drafts a personalised template letter within the 1000-char application limit", async () => {
    const res = await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id) });
    assert.equal(res.status, 200);
    const { source, coverLetter } = res.body.data;
    assert.equal(source, "template");
    assert.match(coverLetter, /Letter Corp/);
    assert.match(coverLetter, /Senior Node Engineer/);
    assert.match(coverLetter, /Node\.js, MongoDB/);
    assert.match(coverLetter, /3 years/);
    assert.match(coverLetter, /Lena Writer$/);
    assert.ok(coverLetter.length <= 950, `letter is ${coverLetter.length} chars`);

    // The result can actually be submitted with an application
    const apply = await env.api.post(`/api/jobs/apply/${job._id}`).set(env.auth(seeker.token)).send({ coverLetter });
    assert.equal(apply.status, 200);
  });

  it("uses the model when available, strips markdown and truncates on a sentence boundary", async () => {
    let seenPrompt = "";
    ai.setCompletionFn(async ({ user }) => {
      seenPrompt = user;
      return "**Dear team,** " + "I love building reliable systems. ".repeat(60);
    });
    const res = await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id), tone: "concise" });
    ai.setCompletionFn(null);
    assert.equal(res.body.data.source, "ai");
    assert.ok(res.body.data.coverLetter.length <= 950);
    assert.ok(!res.body.data.coverLetter.includes("**"));
    assert.ok(res.body.data.coverLetter.endsWith("."));
    assert.match(seenPrompt, /Lena Writer/);
    assert.match(seenPrompt, /brief, direct/);
    assert.match(seenPrompt, /Own our API platform/); // HTML stripped from the description
    assert.doesNotMatch(seenPrompt, /<b>/);
  });

  it("writes the template letter and interview prep in Bangla when asked", async () => {
    const letter = await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id), lang: "bn" });
    assert.equal(letter.status, 200);
    assert.equal(letter.body.data.source, "template");
    assert.match(letter.body.data.coverLetter, /প্রিয় Letter Corp নিয়োগ দল/);
    assert.match(letter.body.data.coverLetter, /Senior Node Engineer/);
    assert.match(letter.body.data.coverLetter, /Lena Writer$/);
    assert.ok(letter.body.data.coverLetter.length <= 950);

    const prep = await env.api.get(`/api/ai/interview-prep/${job._id}?lang=bn`).set(env.auth(seeker.token));
    assert.equal(prep.status, 200);
    assert.ok(prep.body.data.questions.some((q) => /Node\.js/.test(q.question) && /[ঀ-৿]/.test(q.question)));
    assert.ok(prep.body.data.preparationTips.some((t) => /Letter Corp/.test(t) && /[ঀ-৿]/.test(t)));

    // Unknown languages fall back to English rather than failing
    const fallback = await env.api.get(`/api/ai/interview-prep/${job._id}?lang=xx`).set(env.auth(seeker.token));
    assert.equal(fallback.status, 200);
    assert.ok(fallback.body.data.questions.some((q) => /How have you used Node\.js/.test(q.question)));
  });

  it("asks the model to answer in Bangla when the language is bn", async () => {
    const prompts = [];
    ai.setCompletionFn(async ({ user }) => {
      prompts.push(user);
      return "আপনার সময়ের জন্য ধন্যবাদ। ".repeat(20);
    });
    await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id), lang: "bn" });
    await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id) });
    ai.setCompletionFn(null);
    assert.match(prompts[0], /Bangla/);
    assert.doesNotMatch(prompts[1], /Bangla/);
  });

  it("validates input and unknown jobs", async () => {
    assert.equal((await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: "x" })).status, 400);
    assert.equal((await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: String(job._id), tone: "rude" })).status, 400);
    assert.equal((await env.api.post("/api/ai/cover-letter").set(env.auth(seeker.token)).send({ jobId: "0".repeat(24) })).status, 404);
    assert.equal((await env.api.post("/api/ai/cover-letter").set(env.auth(employer.token)).send({ jobId: String(job._id) })).status, 403);
  });

  it("builds interview prep from the job's skills and the candidate's gaps", async () => {
    const res = await env.api.get(`/api/ai/interview-prep/${job._id}`).set(env.auth(seeker.token));
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.equal(d.source, "template");
    assert.ok(d.questions.length >= 5 && d.questions.length <= 10);
    assert.ok(d.questions.some((q) => /Node\.js/.test(q.question) && q.category === "technical"));
    assert.ok(d.questions.some((q) => /Kubernetes/.test(q.question) && /isn't on your profile/.test(q.tip)));
    assert.deepEqual(d.focusSkills, ["Kubernetes"]);
    assert.ok(d.preparationTips.some((t) => /Letter Corp/.test(t)));
    for (const q of d.questions) assert.ok(q.question && q.tip);
  });

  it("uses model questions when valid and falls back when they are unusable", async () => {
    ai.setCompletionFn(async () =>
      JSON.stringify({
        questions: [
          { question: "Explain event loop phases.", category: "technical", tip: "Mention microtasks." },
          { question: "Describe a production incident.", category: "made-up", tip: "STAR." },
          { question: "Why us?", category: "company" },
          { question: "", category: "role" },
        ],
        preparationTips: ["Sleep well"],
      })
    );
    let res = await env.api.get(`/api/ai/interview-prep/${job._id}`).set(env.auth(seeker.token));
    assert.equal(res.body.data.source, "ai");
    assert.equal(res.body.data.questions.length, 3);
    assert.equal(res.body.data.questions[1].category, "role"); // unknown category normalised
    assert.deepEqual(res.body.data.preparationTips, ["Sleep well"]);

    ai.setCompletionFn(async () => JSON.stringify({ questions: [{ question: "Only one?" }] }));
    res = await env.api.get(`/api/ai/interview-prep/${job._id}`).set(env.auth(seeker.token));
    assert.equal(res.body.data.source, "template");
    ai.setCompletionFn(null);

    assert.equal((await env.api.get("/api/ai/interview-prep/xyz").set(env.auth(seeker.token))).status, 400);
    assert.equal((await env.api.get(`/api/ai/interview-prep/${"0".repeat(24)}`).set(env.auth(seeker.token))).status, 404);
  });
});
