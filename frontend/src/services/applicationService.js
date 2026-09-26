import { apiCall } from "./apiBase";

export const applicationService = {
  getMyApplications,
  getPipeline,
  updateStatus,
  getMatchScores,
  getJobMatch,
};

async function getMyApplications() {
  return apiCall("get", "/applications/mine");
}

async function getPipeline(jobId) {
  return apiCall("get", `/applications/pipeline/${jobId}`);
}

async function updateStatus(applicationId, status, note) {
  return apiCall("patch", `/applications/${applicationId}/status`, { status, note });
}

async function getMatchScores(jobIds) {
  return apiCall("post", "/jobs/match-scores", { jobIds });
}

async function getJobMatch(jobId) {
  return apiCall("get", `/jobs/match/${jobId}`);
}
