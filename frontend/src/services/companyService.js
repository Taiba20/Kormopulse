import { apiCall } from "./apiBase";

export const companyService = {
  postNewJob,
  getAllJobListings,
  getCompanyJobListings,
  getMyJobs,
  generateJobDescription,
  getActiveJobListings,
  getNonActiveJobListings,
  getAllApplications,
  getShortListedCandidates,
  shortlistCandidate,
  removeApplication,
  removeFromShortlist,
  getJobApplications,
  applyForJob,
  saveJob,
  removeSavedJob,
  hireCandidate,
};

async function getMyJobs() {
  return apiCall("get", "/jobs/my-jobs");
}

async function getAllJobListings() {
  return apiCall("get", "/jobs/my-jobs");
}

async function getAllApplications(params = {}) {
  return apiCall("get", "/jobs/my-company-applications", { params });
}

async function postNewJob(data) {
  return apiCall("post", "/jobs/post-job", data);
}

async function generateJobDescription(data) {
  return apiCall("post", "/jobs/generate-job-description", data);
}

async function getCompanyJobListings() {
  return apiCall("get", "/jobs/my-jobs");
}

async function getActiveJobListings() {
  return apiCall("get", "/jobs/my-jobs", { params: { status: 'active' } });
}

async function getNonActiveJobListings() {
  return apiCall("get", "/jobs/my-jobs", { params: { status: 'inactive' } });
}

async function getShortListedCandidates() {
  // This would need to be implemented in backend
  return apiCall("get", "/company/shortlisted-candidates");
}

async function shortlistCandidate(data) {
  return apiCall("post", "/jobs/shortlist-candidate", data);
}

async function removeApplication(data) {
  return apiCall("post", "/jobs/reject-candidate", data);
}

async function removeFromShortlist(data) {
  return apiCall("post", "/jobs/remove-from-shortlist", data);
}

// Add new functions for job applications
async function getJobApplications(jobId, page = 1, limit = 10, status = 'all') {
  return apiCall("get", `/jobs/jobs/${jobId}/applications`, { 
    params: { page, limit, status } 
  });
}

async function applyForJob(jobId, applicationData = {}) {
  return apiCall("post", `/jobs/apply/${jobId}`, applicationData);
}

async function saveJob(jobId) {
  return apiCall("post", `/jobs/save/${jobId}`);
}

async function removeSavedJob(jobId) {
  return apiCall("post", `/jobs/remove-saved-job/${jobId}`);
}

async function hireCandidate(data) {
  return apiCall("post", "/jobs/hire-candidate", data);
}
