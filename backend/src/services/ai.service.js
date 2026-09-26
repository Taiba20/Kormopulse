import Groq from "groq-sdk";
import { parseResumeHeuristically } from "../utils/resumeHeuristics.js";
import { computeMatch } from "../utils/matchScore.js";

const MODEL = () => process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export const isAiConfigured = () => Boolean(process.env.GROQ_API_KEY);

// Test seam: lets tests supply a fake completion function instead of calling Groq
let completionOverride = null;
export const setCompletionFn = (fn) => {
  completionOverride = fn;
};

/** Runs one chat completion and returns the text. Throws if Groq is not configured. */
const complete = async ({ system, user, json = false, maxTokens = 1200, temperature = 0.4 }) => {
  if (completionOverride) return completionOverride({ system, user, json });
  if (!isAiConfigured()) throw new Error("GROQ_API_KEY is not set");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: MODEL(),
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content?.trim() || "";
};

const safeJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const stripHtml = (html = "") =>
  String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const str = (value, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const list = (value, max, mapper) => (Array.isArray(value) ? value.slice(0, max).map(mapper).filter(Boolean) : []);
const dedupeCaseInsensitive = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const yearOrUndefined = (value) => {
  const n = Number(String(value ?? "").match(/\d{4}/)?.[0]);
  return n >= 1950 && n <= 2100 ? n : undefined;
};

/** Normalises whatever the model returned into the shape the profile expects. */
export const sanitizeParsedProfile = (raw = {}) => ({
  name: str(raw.name, 80),
  email: str(raw.email, 120),
  contactNumber: str(raw.contactNumber ?? raw.phone, 30),
  bio: str(raw.bio ?? raw.summary, 600),
  primaryRole: str(raw.primaryRole ?? raw.title, 80),
  location: str(raw.location, 80),
  yearsOfExperience: String(Math.max(0, Math.min(50, Math.round(Number(raw.yearsOfExperience) || 0)))),
  skills: dedupeCaseInsensitive(list(raw.skills, 40, (s) => str(typeof s === "string" ? s : s?.name, 40))),
  education: list(raw.education, 6, (e) => {
    const entry = {
      institution: str(e?.institution, 120),
      degree: str(e?.degree, 80),
      fieldOfStudy: str(e?.fieldOfStudy ?? e?.field, 80),
      startYear: yearOrUndefined(e?.startYear),
      endYear: yearOrUndefined(e?.endYear),
    };
    return entry.institution || entry.degree ? entry : null;
  }),
  workExperience: list(raw.workExperience ?? raw.experience, 8, (w) => {
    const jobTitle = str(w?.jobTitle ?? w?.title, 80);
    if (!jobTitle) return null;
    const endRaw = str(w?.endMonth ?? w?.endDate, 20);
    const current = Boolean(w?.currentJob) || /present|current|ongoing/i.test(endRaw);
    const toMonth = (v) => {
      const m = String(v || "").match(/((?:19|20)\d{2})(?:-(\d{1,2}))?/);
      return m ? `${m[1]}-${String(m[2] || "1").padStart(2, "0")}` : undefined;
    };
    return {
      jobTitle,
      company: { name: str(typeof w?.company === "string" ? w.company : w?.company?.name, 100) },
      startMonth: toMonth(w?.startMonth ?? w?.startDate),
      endMonth: current ? undefined : toMonth(endRaw),
      currentJob: current,
      description: str(w?.description, 400),
    };
  }),
  socialProfiles: {
    linkedIn: str(raw.socialProfiles?.linkedIn ?? raw.linkedin, 200) || undefined,
    github: str(raw.socialProfiles?.github ?? raw.github, 200) || undefined,
    portfolioWebsite: str(raw.socialProfiles?.portfolioWebsite ?? raw.website, 200) || undefined,
  },
});

/** Parses resume text with the LLM, falling back to rules when AI is unavailable. */
export const parseResume = async (text) => {
  if (isAiConfigured() || completionOverride) {
    try {
      const reply = await complete({
        json: true,
        maxTokens: 2000,
        temperature: 0.1,
        system:
          "You extract structured data from resumes. Reply with ONE JSON object and nothing else. Never invent facts: leave a field empty when the resume does not state it.",
        user: `Extract this resume into JSON with exactly these keys:
{"name":"", "email":"", "contactNumber":"", "bio":"2-3 sentence professional summary", "primaryRole":"most recent or target job title", "location":"city, country", "yearsOfExperience": number, "skills":["..."], "education":[{"institution":"","degree":"","fieldOfStudy":"","startYear":2018,"endYear":2022}], "workExperience":[{"jobTitle":"","company":"","startMonth":"YYYY-MM","endMonth":"YYYY-MM or empty if current","currentJob":false,"description":"one sentence"}], "socialProfiles":{"linkedIn":"","github":"","portfolioWebsite":""}}

RESUME:
"""
${text.slice(0, 12000)}
"""`,
      });
      const parsed = safeJson(reply);
      if (parsed) {
        const profile = sanitizeParsedProfile(parsed);
        // The rule-based pass is reliable for contact details; use it to fill any gaps
        const rules = parseResumeHeuristically(text);
        profile.email ||= rules.email;
        profile.contactNumber ||= rules.contactNumber;
        profile.socialProfiles.linkedIn ||= rules.socialProfiles.linkedIn;
        profile.socialProfiles.github ||= rules.socialProfiles.github;
        if (!profile.skills.length) profile.skills = rules.skills;
        return { source: "ai", profile };
      }
    } catch (error) {
      console.error("[ai] resume parsing failed, using rule-based fallback:", error.message);
    }
  }
  return { source: "rules", profile: sanitizeParsedProfile(parseResumeHeuristically(text)) };
};

// ---- Cover letters ------------------------------------------------------------

const TONES = {
  professional: "professional and confident",
  enthusiastic: "warm, energetic and enthusiastic",
  concise: "brief, direct and to the point",
};

const clampLetter = (letter, max = 950) => {
  const text = String(letter).replace(/\*\*/g, "").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf("!"));
  return (lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : cut).trim();
};

const templateCoverLetter = ({ candidate, job, companyName }) => {
  const skills = (job.skills || []).filter((s) => (candidate.skills || []).some((c) => c.toLowerCase() === s.toLowerCase())).slice(0, 4);
  const shown = skills.length ? skills : (candidate.skills || []).slice(0, 3);
  const years = Number(candidate.yearsOfExperience) || 0;
  return clampLetter(
    `Dear Hiring Team at ${companyName},\n\n` +
      `I am excited to apply for the ${job.title} position. ` +
      (years ? `With ${years} year${years === 1 ? "" : "s"} of experience` : "With my background") +
      (candidate.primaryRole ? ` as a ${candidate.primaryRole}` : "") +
      (shown.length ? ` and hands-on skills in ${shown.join(", ")}` : "") +
      `, I am confident I can contribute from day one.\n\n` +
      `I enjoy solving practical problems, learning quickly and working closely with a team to deliver reliable results. ` +
      `${companyName}'s work is exactly the kind of environment where I want to grow.\n\n` +
      `Thank you for your time and consideration. I would welcome the chance to discuss how I can support your team.\n\n` +
      `Sincerely,\n${candidate.name || "Applicant"}`
  );
};

export const generateCoverLetter = async ({ candidate, job, companyName, tone = "professional" }) => {
  if (isAiConfigured() || completionOverride) {
    try {
      const reply = await complete({
        maxTokens: 500,
        temperature: 0.7,
        system:
          "You write concise, honest cover letters. Use only facts provided. Never invent employers, degrees or numbers. Output the letter text only, with no preamble, no markdown and no placeholders like [Name].",
        user: `Write a ${TONES[tone] || TONES.professional} cover letter of at most 900 characters.

Candidate: ${candidate.name || "the applicant"}
Current/target role: ${candidate.primaryRole || "not stated"}
Years of experience: ${candidate.yearsOfExperience || 0}
Skills: ${(candidate.skills || []).slice(0, 15).join(", ") || "not stated"}
Recent experience: ${(candidate.recentExperience || []).join("; ") || "not stated"}

Job: ${job.title} at ${companyName}
Required skills: ${(job.skills || []).join(", ") || "not stated"}
Job description: ${stripHtml(job.description).slice(0, 700)}

Address it to the hiring team, highlight the skills that overlap with the job, and end with the candidate's name.`,
      });
      if (reply.length > 80) return { source: "ai", coverLetter: clampLetter(reply) };
    } catch (error) {
      console.error("[ai] cover letter failed, using template:", error.message);
    }
  }
  return { source: "template", coverLetter: templateCoverLetter({ candidate, job, companyName }) };
};

// ---- Interview preparation --------------------------------------------------------

const GENERIC_QUESTIONS = [
  { question: "Tell me about yourself and why you are interested in this role.", category: "behavioral", tip: "Keep it to 60-90 seconds: present, past, then why this job." },
  { question: "Describe a challenging problem you solved recently. What was your approach?", category: "behavioral", tip: "Use the STAR method: Situation, Task, Action, Result." },
  { question: "Tell me about a time you worked in a team with a disagreement. How did you handle it?", category: "behavioral", tip: "Focus on listening, compromise and the outcome." },
  { question: "What are your strengths, and what are you actively improving?", category: "behavioral", tip: "Pick a real weakness and show what you are doing about it." },
  { question: "Why do you want to work at this company?", category: "company", tip: "Reference the company's product, mission or recent news." },
];

const templatePrep = ({ candidate, job, companyName }) => {
  const match = computeMatch(candidate, job);
  const skillQuestions = (job.skills || []).slice(0, 4).map((skill) => ({
    question: `How have you used ${skill} in a real project? What went well and what would you change?`,
    category: "technical",
    tip: `Prepare one concrete example with ${skill}: the goal, your part, and a measurable result.`,
  }));
  const gapQuestions = match.missingSkills.slice(0, 2).map((skill) => ({
    question: `This role uses ${skill}. How would you get productive with it quickly?`,
    category: "role",
    tip: `${skill} isn't on your profile. Show a learning plan and any related experience.`,
  }));
  return {
    questions: [
      ...skillQuestions,
      ...gapQuestions,
      { question: `What would your first 90 days as a ${job.title} look like?`, category: "role", tip: "Show you will listen first, then deliver a small early win." },
      ...GENERIC_QUESTIONS,
    ].slice(0, 10),
    preparationTips: [
      `Research ${companyName}: products, customers, competitors and recent news.`,
      "Re-read the job description and map each requirement to an example from your experience.",
      "Prepare 2-3 thoughtful questions to ask the interviewers.",
      "Test your camera, microphone and internet 15 minutes early for online interviews.",
    ],
    focusSkills: match.missingSkills.slice(0, 5),
  };
};

const CATEGORIES = ["technical", "behavioral", "role", "company"];

export const generateInterviewPrep = async ({ candidate, job, companyName }) => {
  if (isAiConfigured() || completionOverride) {
    try {
      const reply = await complete({
        json: true,
        maxTokens: 1400,
        temperature: 0.5,
        system: "You are an experienced interviewer helping a candidate prepare. Reply with ONE JSON object and nothing else.",
        user: `Create interview preparation for this candidate.
Return JSON: {"questions":[{"question":"","category":"technical|behavioral|role|company","tip":"how to answer well"}],"preparationTips":["..."]}
Give 8 questions (mix of technical for the required skills, behavioral, role-specific and company) and 4 preparation tips.

Job: ${job.title} at ${companyName}
Required skills: ${(job.skills || []).join(", ") || "not stated"}
Description: ${stripHtml(job.description).slice(0, 700)}

Candidate skills: ${(candidate.skills || []).slice(0, 15).join(", ") || "not stated"}
Candidate experience: ${candidate.yearsOfExperience || 0} years as ${candidate.primaryRole || "unspecified"}`,
      });
      const parsed = safeJson(reply);
      const questions = list(parsed?.questions, 10, (q) =>
        str(q?.question, 300)
          ? { question: str(q.question, 300), category: CATEGORIES.includes(q?.category) ? q.category : "role", tip: str(q?.tip, 300) }
          : null
      );
      if (questions.length >= 3) {
        return {
          source: "ai",
          questions,
          preparationTips: list(parsed?.preparationTips, 6, (t) => str(t, 250)),
          focusSkills: computeMatch(candidate, job).missingSkills.slice(0, 5),
        };
      }
    } catch (error) {
      console.error("[ai] interview prep failed, using template:", error.message);
    }
  }
  return { source: "template", ...templatePrep({ candidate, job, companyName }) };
};
