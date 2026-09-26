import { apiCall } from "./apiBase";

export const adminService = {
  getStats,
  listUsers,
  suspendUser,
  deleteUser,
  listJobs,
  setJobStatus,
  deleteJob,
  listReviews,
  runJobAlerts,
};

async function getStats(days = 30) {
  return apiCall("get", "/admin/stats", { params: { days } });
}

async function listUsers(params = {}) {
  return apiCall("get", "/admin/users", { params });
}

async function suspendUser(id, suspended, reason) {
  return apiCall("patch", `/admin/users/${id}/suspend`, { suspended, reason });
}

async function deleteUser(id) {
  return apiCall("delete", `/admin/users/${id}`);
}

async function listJobs(params = {}) {
  return apiCall("get", "/admin/jobs", { params });
}

async function setJobStatus(id, isActive) {
  return apiCall("patch", `/admin/jobs/${id}/status`, { isActive });
}

async function deleteJob(id) {
  return apiCall("delete", `/admin/jobs/${id}`);
}

async function listReviews(params = {}) {
  return apiCall("get", "/admin/reviews", { params });
}

async function runJobAlerts() {
  return apiCall("post", "/admin/run-job-alerts");
}
