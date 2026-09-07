import { apiCall } from './userService.js';

// Job Services
export const jobService = {
  getJobs,
  getJobById,
  createJob,
  getMyJobs,
  generateJobDescription,
  applyForJob,
  saveJob,
  removeSavedJob,
  getSavedJobs,
  getMyApplications,
  getJobApplications,
  getJobLocations,
  getCompanies,
};

async function getJobs(filters = {}) {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });
  
  const response = await apiCall.get(`/jobs/jobs?${queryParams.toString()}`);
  return response.data;
}

async function getJobById(jobId) {
  const response = await apiCall.get(`/jobs/jobs/${jobId}`);
  return response.data;
}

async function createJob(jobData) {
  const response = await apiCall.post('/jobs/jobs', jobData);
  return response.data;
}

async function getMyJobs(page = 1, limit = 10, status = 'all') {
  const response = await apiCall.get(`/jobs/my-jobs?page=${page}&limit=${limit}&status=${status}`);
  return response.data;
}

async function generateJobDescription(jobDetails) {
  const response = await apiCall.post('/jobs/generate-job-description', jobDetails);
  return response.data;
}

async function applyForJob(jobId, applicationData = {}) {
  const response = await apiCall.post(`/jobs/apply/${jobId}`, applicationData);
  return response.data;
}

async function saveJob(jobId) {
  const response = await apiCall.post(`/jobs/save/${jobId}`);
  return response.data;
}

async function removeSavedJob(jobId) {
  const response = await apiCall.post(`/jobs/remove-saved-job/${jobId}`);
  return response.data;
}

async function getSavedJobs() {
  const response = await apiCall.get('/jobs/saved-jobs');
  return response.data;
}

async function getMyApplications(page = 1, limit = 10, status = 'all') {
  const response = await apiCall.get(`/jobs/my-applications?page=${page}&limit=${limit}&status=${status}`);
  return response.data;
}

async function getJobApplications(jobId, page = 1, limit = 10, status = 'all') {
  const response = await apiCall.get(`/jobs/jobs/${jobId}/applications?page=${page}&limit=${limit}&status=${status}`);
  return response.data;
}

async function getJobLocations(search = '') {
  const response = await apiCall.get(`/jobs/job-locations?search=${search}`);
  return response.data;
}

async function getCompanies() {
  const response = await apiCall.get('/jobs/companies');
  return response.data;
}

export default jobService;