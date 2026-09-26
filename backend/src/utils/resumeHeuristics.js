// Rule-based resume parsing. It is the fallback when no AI key is configured (or the AI call
// fails), so it favours precision: it only reports what it can clearly recognise.

const SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift",
  "Dart", "Scala", "R", "MATLAB", "SQL", "NoSQL", "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap",
  "React", "React Native", "Next.js", "Vue", "Angular", "Svelte", "Redux", "jQuery",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", ".NET", "ASP.NET",
  "Flutter", "Android", "iOS", "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis", "Firebase", "Elasticsearch",
  "GraphQL", "REST API", "Microservices", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Terraform",
  "Linux", "Git", "GitHub", "CI/CD", "Jenkins", "GitHub Actions", "Nginx", "Selenium", "Jest", "Cypress",
  "Machine Learning", "Deep Learning", "Data Science", "Data Analysis", "NLP", "Computer Vision", "TensorFlow",
  "PyTorch", "Pandas", "NumPy", "scikit-learn", "Power BI", "Tableau", "Excel", "Apache Spark", "Hadoop",
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX", "Wireframing", "Prototyping",
  "Agile", "Scrum", "Jira", "Project Management", "Product Management", "Business Analysis",
  "SEO", "Digital Marketing", "Content Writing", "Copywriting", "Social Media Marketing", "Google Analytics",
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Customer Service", "Sales", "Accounting",
  "Financial Analysis", "Recruitment", "Public Speaking", "Networking", "Cybersecurity", "Penetration Testing",
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const skillRegex = (skill) => {
  const body = escapeRegex(skill);
  // Word boundaries do not work next to symbols such as "C++" or ".NET", so use explicit look-arounds
  return new RegExp(`(?<![A-Za-z0-9+#])${body}(?![A-Za-z0-9+#])`, "i");
};

export const extractSkills = (text) => SKILLS.filter((skill) => skillRegex(skill).test(text));

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?880[\s-]?)?0?1[3-9](?:[\s-]?\d){8}|\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9\-_]+\/?/i;

const withProtocol = (url) => (url && !/^https?:\/\//i.test(url) ? `https://${url}` : url);

const guessName = (lines) => {
  for (const line of lines.slice(0, 6)) {
    const clean = line.trim();
    if (!clean || /@|\d|http|resume|curriculum|vitae/i.test(clean)) continue;
    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Za-z.'-]+$/.test(w))) {
      return words.map((w) => (w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w)).join(" ");
    }
  }
  return "";
};

const DEGREE_RE = /(B\.?\s?Sc\.?|M\.?\s?Sc\.?|B\.?\s?Tech|M\.?\s?Tech|B\.?\s?A\.?|M\.?\s?A\.?|BBA|MBA|B\.?Eng|M\.?Eng|Bachelor[^,\n]*|Master[^,\n]*|Diploma[^,\n]*|Ph\.?D\.?|HSC|SSC)/i;
const INSTITUTION_RE = /([A-Z][A-Za-z&.' -]{2,60}(?:University|College|Institute|School|Academy)(?: of [A-Z][A-Za-z ]{2,40})?)/;
const YEAR_RANGE_RE = /((?:19|20)\d{2})\s*(?:-|–|—|to)\s*((?:19|20)\d{2}|present|current|ongoing)/i;

const sectionBetween = (text, startRe, endRe) => {
  const start = text.search(startRe);
  if (start === -1) return "";
  const rest = text.slice(start);
  const end = rest.slice(20).search(endRe);
  return end === -1 ? rest : rest.slice(0, end + 20);
};

const extractEducation = (text) => {
  const block = sectionBetween(text, /\n\s*(education|academic)[^\n]*\n/i, /\n\s*(experience|employment|skills|projects|certifications|work history)[^\n]*\n/i);
  const source = block || text;
  const entries = [];
  const lines = source.split("\n").map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length && entries.length < 4; i++) {
    const window = `${lines[i]} ${lines[i + 1] || ""}`;
    const institution = window.match(INSTITUTION_RE)?.[1];
    const degree = window.match(DEGREE_RE)?.[1];
    if (!institution && !degree) continue;
    if (!institution || !degree) {
      if (!block) continue; // outside an education section require both
    }
    const range = window.match(YEAR_RANGE_RE);
    const singleYear = window.match(/\b((?:19|20)\d{2})\b/);
    const entry = {
      institution: institution?.trim() || "",
      degree: degree?.trim() || "",
      fieldOfStudy: (window.match(/(?:in|of)\s+([A-Z][A-Za-z &]{3,40})/)?.[1] || "").trim(),
      startYear: range ? Number(range[1]) : undefined,
      endYear: range ? (/\d/.test(range[2]) ? Number(range[2]) : undefined) : singleYear ? Number(singleYear[1]) : undefined,
    };
    if (!entries.some((e) => e.institution === entry.institution && e.degree === entry.degree)) {
      entries.push(entry);
      i += 1;
    }
  }
  return entries;
};

const extractExperience = (text) => {
  const block = sectionBetween(text, /\n\s*(work experience|professional experience|experience|employment)[^\n]*\n/i, /\n\s*(education|skills|projects|certifications|languages)[^\n]*\n/i);
  if (!block) return [];
  const entries = [];
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean).slice(1);

  for (let i = 0; i < lines.length && entries.length < 6; i++) {
    const range = lines[i].match(YEAR_RANGE_RE);
    if (!range) continue;
    // Title/company usually share the date's line; otherwise they sit on the line above
    const own = lines[i].replace(YEAR_RANGE_RE, "").replace(/[()|,\s\-–—]+$/, "").trim();
    const header = own.length > 3 ? own : lines[i - 1] || "";
    const parts = header.split(/\s+(?:at|@|-|–|—|\|)\s+|,\s*/).map((p) => p.trim()).filter((p) => p.length > 1);
    const jobTitle = parts[0] || "";
    const company = parts[1] || "";
    if (!jobTitle) continue;
    entries.push({
      jobTitle: jobTitle.slice(0, 80),
      company: { name: company.slice(0, 80) },
      startMonth: `${range[1]}-01`,
      endMonth: /\d/.test(range[2]) ? `${range[2]}-12` : undefined,
      currentJob: !/\d/.test(range[2]),
      description: (lines[i + 1] || "").slice(0, 300),
    });
  }
  return entries;
};

const estimateYears = (text, experience) => {
  const stated = text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|relevant\s+|work\s+)?experience/i);
  if (stated) return Number(stated[1]);
  if (!experience.length) return 0;
  const thisYear = new Date().getFullYear();
  const spans = experience.map((e) => {
    const start = Number(String(e.startMonth).slice(0, 4));
    const end = e.currentJob || !e.endMonth ? thisYear : Number(String(e.endMonth).slice(0, 4));
    return Math.max(0, end - start);
  });
  return Math.min(40, spans.reduce((a, b) => a + b, 0));
};

export const parseResumeHeuristically = (rawText) => {
  const text = `\n${rawText}\n`;
  const lines = rawText.split("\n");
  const experience = extractExperience(text);
  const github = withProtocol(rawText.match(GITHUB_RE)?.[0]);
  const linkedIn = withProtocol(rawText.match(LINKEDIN_RE)?.[0]);

  const summary = sectionBetween(text, /\n\s*(summary|profile|objective|about me)[^\n]*\n/i, /\n\s*(experience|education|skills|projects)[^\n]*\n/i)
    .split("\n")
    .slice(1)
    .join(" ")
    .trim();

  return {
    name: guessName(lines),
    email: rawText.match(EMAIL_RE)?.[0] || "",
    contactNumber: (rawText.match(PHONE_RE)?.[0] || "").replace(/\s+/g, " ").trim(),
    bio: summary.slice(0, 500),
    skills: extractSkills(rawText),
    yearsOfExperience: String(estimateYears(text, experience)),
    primaryRole: experience[0]?.jobTitle || "",
    location: "",
    education: extractEducation(text),
    workExperience: experience,
    socialProfiles: { linkedIn: linkedIn || undefined, github: github || undefined },
  };
};
