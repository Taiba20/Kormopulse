import { apiCall } from "./apiBase";
import api from "./apiBase";

export const aiService = {
  parseResume,
  applyResume,
  generateCoverLetter,
  getInterviewPrep,
};

// FormData uploads go through the raw axios instance: the browser sets the multipart boundary
// header itself, and apiCall's (method, url, data) shape has no room for extra config.
async function parseResume(file) {
  const form = new FormData();
  form.append("resume", file);
  const res = await api.post("/ai/resume/parse", form);
  return res.data.data;
}

async function applyResume(profile, overwrite = false) {
  return apiCall("post", "/ai/resume/apply", { profile, overwrite });
}

async function generateCoverLetter(jobId, tone = "professional", lang = "en") {
  return apiCall("post", "/ai/cover-letter", { jobId, tone, lang });
}

async function getInterviewPrep(jobId, lang = "en") {
  return apiCall("get", `/ai/interview-prep/${jobId}?lang=${lang}`);
}
