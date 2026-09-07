import { apiCall } from "./apiBase";

export const contentService = {
  getJobs,
  getSingleJob,
  getJobLocations,
  getCompanies,
  getSavedJobs,
};
async function getJobs(filters) {
  let params = new URLSearchParams();
  
  // Search term
  if (filters.search) params.append("search", filters.search);
  
  // Date posted filter
  if (filters.datePosted) params.append("datePosted", filters.datePosted);
  
  // Experience filter
  if (filters.experience && filters.experience !== "") {
    params.append("experience", filters.experience);
  }
  
  // Salary range filters
  if (filters.salaryRange?.from && filters.salaryRange.from !== "") {
    params.append("minSalary", filters.salaryRange.from);
  }
  if (filters.salaryRange?.to && filters.salaryRange.to !== "") {
    params.append("maxSalary", filters.salaryRange.to);
  }
  
  // Location filter
  if (filters.location) params.append("location", filters.location);
  
  // Company filter
  if (filters.company) params.append("company", filters.company);
  
  // Job types filter (multiple values)
  if (filters.jobTypes && filters.jobTypes.length > 0) {
    filters.jobTypes.forEach((jobType) => {
      // Convert frontend job type format to backend format
      const backendJobType = jobType.toLowerCase();
      params.append("jobType", backendJobType);
    });
  }
  
  // Work mode filter (multiple values)
  if (filters.workMode && filters.workMode.length > 0) {
    filters.workMode.forEach((workMode) => {
      // Convert frontend work mode format to backend format
      const backendWorkMode = workMode.toLowerCase();
      params.append("workMode", backendWorkMode);
    });
  }

  console.log('Frontend filters:', filters);
  console.log('API call params:', params.toString());
  
  return apiCall("get", "/jobs/jobs", { params: params });
}

async function getSingleJob(id) {
  return apiCall("get", `/jobs/jobs/${id}`);
}

async function getJobLocations(location) {
  return apiCall("get", "/jobs/job-locations", { params: { search: location } });
}

async function getCompanies() {
  return apiCall("get", "/jobs/companies");
}

async function getSavedJobs() {
  return apiCall("get", "/jobs/saved-jobs");
}
