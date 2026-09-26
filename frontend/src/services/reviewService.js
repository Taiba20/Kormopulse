import { apiCall } from "./apiBase";

export const reviewService = {
  getCompanyReviews,
  createReview,
  updateReview,
  deleteReview,
  getPublicCompany,
  getSalaryInsights,
};

async function getCompanyReviews(companyId, params = {}) {
  return apiCall("get", `/reviews/company/${companyId}`, { params });
}

async function createReview(companyId, data) {
  return apiCall("post", `/reviews/company/${companyId}`, data);
}

async function updateReview(id, data) {
  return apiCall("put", `/reviews/${id}`, data);
}

async function deleteReview(id) {
  return apiCall("delete", `/reviews/${id}`);
}

async function getPublicCompany(companyId) {
  return apiCall("get", `/jobs/company/${companyId}`);
}

async function getSalaryInsights(params = {}) {
  return apiCall("get", "/jobs/salary-insights", { params });
}
