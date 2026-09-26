// Deterministic job <-> candidate match scoring. No AI call is needed, so it is instant,
// free, repeatable, and can run for every job card on a listing page.

const WEIGHTS = { skills: 55, experience: 20, location: 10, preferences: 15 };

// Common spellings that should count as the same skill
const ALIASES = {
  js: "javascript",
  ts: "typescript",
  nodejs: "node",
  "node.js": "node",
  reactjs: "react",
  "react.js": "react",
  vuejs: "vue",
  "vue.js": "vue",
  nextjs: "next",
  "next.js": "next",
  expressjs: "express",
  mongo: "mongodb",
  postgres: "postgresql",
  py: "python",
  golang: "go",
  "c#": "csharp",
  "c++": "cpp",
  ml: "machinelearning",
  "machine learning": "machinelearning",
  "ci/cd": "cicd",
};

export const normalizeSkill = (skill) => {
  const raw = String(skill || "").trim().toLowerCase();
  if (!raw) return "";
  const aliased = ALIASES[raw] ?? raw;
  return aliased.replace(/[^a-z0-9+#]/g, "");
};

/** "3" -> 3, "3-5" -> 4, "5+" -> 5, "" / garbage -> 0 */
export const parseYears = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const range = text.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)/i);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  const single = text.match(/\d+(?:\.\d+)?/);
  return single ? parseFloat(single[0]) : 0;
};

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const sameCity = (a, b) => {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x) || x.split(/[,\s]+/).some((part) => part.length > 2 && y.includes(part));
};

/**
 * @param {object} candidate  { skills, yearsOfExperience, location, primaryRole, jobPreferences }
 * @param {object} job        { skills, experience: {min,max}, location, workMode, jobType, title }
 */
export const computeMatch = (candidate = {}, job = {}) => {
  const jobSkills = (job.skills || []).filter(Boolean);
  const candSkills = (candidate.skills || []).filter(Boolean);
  const candSet = new Map(candSkills.map((s) => [normalizeSkill(s), s]));

  const matchedSkills = [];
  const missingSkills = [];
  for (const skill of jobSkills) {
    if (candSet.has(normalizeSkill(skill))) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  // --- Skills: share of required skills the candidate has. If the job lists none, stay neutral.
  const skillsRatio = jobSkills.length ? matchedSkills.length / jobSkills.length : 0.5;

  // --- Experience: full marks inside [min, max]; decays as the gap grows
  const years = parseYears(candidate.yearsOfExperience);
  const minExp = Number(job.experience?.min) || 0;
  const maxExp = Number(job.experience?.max) || minExp;
  let experienceRatio = 1;
  let experienceNote = "Experience fits the requirement";
  if (years < minExp) {
    experienceRatio = clamp(1 - (minExp - years) / Math.max(minExp, 1));
    experienceNote = `${(minExp - years).toFixed(1).replace(/\.0$/, "")} year(s) below the minimum`;
  } else if (maxExp > 0 && years > maxExp + 3) {
    experienceRatio = 0.7; // heavily overqualified: still a decent fit, not a perfect one
    experienceNote = "More experienced than the role asks for";
  }

  // --- Location: remote roles fit anyone
  let locationRatio;
  if (job.workMode === "remote") locationRatio = 1;
  else if (!candidate.location) locationRatio = 0.5;
  else locationRatio = sameCity(candidate.location, job.location) ? 1 : 0.2;

  // --- Preferences: job type / preferred location / role keyword overlap
  const prefs = candidate.jobPreferences || {};
  const prefParts = [];
  if (prefs.types?.length) {
    prefParts.push(prefs.types.map((t) => String(t).toLowerCase()).includes(String(job.jobType).toLowerCase()) ? 1 : 0);
  }
  if (prefs.locations?.length && job.workMode !== "remote") {
    prefParts.push(prefs.locations.some((l) => sameCity(l, job.location)) ? 1 : 0);
  }
  if (candidate.primaryRole && job.title) {
    const roleWords = String(candidate.primaryRole).toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const titleLower = String(job.title).toLowerCase();
    if (roleWords.length) prefParts.push(roleWords.some((w) => titleLower.includes(w)) ? 1 : 0);
  }
  const preferencesRatio = prefParts.length ? prefParts.reduce((a, b) => a + b, 0) / prefParts.length : 0.5;

  const breakdown = {
    skills: Math.round(skillsRatio * WEIGHTS.skills),
    experience: Math.round(experienceRatio * WEIGHTS.experience),
    location: Math.round(locationRatio * WEIGHTS.location),
    preferences: Math.round(preferencesRatio * WEIGHTS.preferences),
  };
  const score = clamp(
    breakdown.skills + breakdown.experience + breakdown.location + breakdown.preferences,
    0,
    100
  );

  return {
    score,
    label: score >= 80 ? "Excellent match" : score >= 60 ? "Good match" : score >= 40 ? "Fair match" : "Low match",
    matchedSkills,
    missingSkills,
    breakdown,
    maxBreakdown: WEIGHTS,
    experienceNote,
  };
};

/** Flattens a User (with populated jobSeekerProfile and/or legacy userProfile) into scoring input. */
export const candidateFromUser = (user) => {
  const profile = user?.jobSeekerProfile?.toObject?.() ?? user?.jobSeekerProfile ?? {};
  const legacy = user?.userProfile ?? {};
  const pick = (key) => (profile && profile[key] !== undefined && profile[key] !== "" ? profile[key] : legacy[key]);
  return {
    skills: pick("skills") || [],
    yearsOfExperience: pick("yearsOfExperience"),
    location: pick("location") || legacy?.address?.city || profile?.address?.city,
    primaryRole: pick("primaryRole"),
    jobPreferences: pick("jobPreferences") || {},
  };
};
