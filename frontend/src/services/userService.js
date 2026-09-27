import axios from 'axios';
import { api_url } from '../../config';

export const apiCall = axios.create({
  baseURL: api_url,
  withCredentials: true,
});

// Direct function exports for compatibility with existing imports
export const loginUser = (data) => apiCall.post('/users/login', data);
export const registerUser = (data) => apiCall.post('/users/signup', data);
export const logoutUser = () => apiCall.post('/users/logout');
export const getCurrentUser = () => apiCall.get('/users/current-user');
export const updateUserProfile = (data) => apiCall.put('/users/update-profile', data);
export const forgotPassword = (data) => apiCall.post('/users/forgot-password', data);
export const resetPassword = (data) => apiCall.post('/users/reset-password', data);
export const verifyEmail = (code) => apiCall.post('/users/verify-email', { code });
export const resendVerification = () => apiCall.post('/users/resend-verification');
export const googleLogin = (credential, role, language) => apiCall.post('/users/google', { credential, role, language });
export const updateLanguage = (language) => apiCall.patch('/users/language', { language });
export const verifyTwoFactorLogin = (twoFactorToken, code) => apiCall.post('/users/2fa/login-verify', { twoFactorToken, code });

// Enhanced userService object with all methods
export const userService = {
  login,
  signup,
  logout,
  getCurrentUser: getCurrentUser,
  updateProfilePicture,
  updateUserProfile: updateUserProfile,
  addSkill,
  removeSkill,
  updateResume,
  saveJob,
  applyForJob,
  removeSavedJob,
  getPublicProfile,
  getSavedJobs,
  getMyApplications,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  changePassword,
  checkApplicationStatus,
  forgotPassword: forgotPassword,
  resetPassword: resetPassword,
  // Return the raw axios response, like the standalone exports above
  verifyEmail,
  resendVerification,
  googleLogin,
  updateLanguage,
  verifyTwoFactorLogin,
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  regenerateTwoFactorBackupCodes,
};

async function login(userData) {
  const response = await apiCall.post("/users/login", userData);
  return response.data;
}

async function signup(userData) {
  const response = await apiCall.post("/users/signup", userData);
  return response.data;
}

async function updateProfilePicture(file) {
  const formPayload = new FormData();
  formPayload.append("profilePicture", file);
  const response = await apiCall.post("/users/profile-picture", formPayload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function logout() {
  const response = await apiCall.post("/users/logout");
  return response.data;
}

async function addSkill(skill) {
  const response = await apiCall.post("/users/add-skill", { skill });
  return response.data;
}

async function removeSkill(skill) {
  const response = await apiCall.post("/users/remove-skill", { skill });
  return response.data;
}

async function updateResume(resume) {
  const response = await apiCall.post("/users/resume", { resume });
  return response.data;
}

async function saveJob(id) {
  const response = await apiCall.post(`/jobs/save/${id}`, {});
  return response.data;
}

async function applyForJob(id, data = {}) {
  const response = await apiCall.post(`/jobs/apply/${id}`, data);
  return response.data;
}

async function removeSavedJob(jobId) {
  const response = await apiCall.post(`/jobs/remove-saved-job/${jobId}`);
  return response.data;
}

async function getPublicProfile(id) {
  const response = await apiCall.get(`/users/public-profile/${id}`);
  return response.data;
}

async function getSavedJobs() {
  const response = await apiCall.get("/users/saved-jobs");
  return response.data;
}

async function getMyApplications() {
  const response = await apiCall.get("/users/my-applications");
  return response.data;
}

// Work Experience functions
async function addWorkExperience(experienceData) {
  const response = await apiCall.post("/users/work-experience", experienceData);
  return response.data;
}

async function updateWorkExperience(experienceId, experienceData) {
  const response = await apiCall.put(`/users/work-experience/${experienceId}`, experienceData);
  return response.data;
}

async function deleteWorkExperience(experienceId) {
  const response = await apiCall.delete(`/users/work-experience/${experienceId}`);
  return response.data;
}

// Education functions
async function addEducation(educationData) {
  const response = await apiCall.post("/users/education", educationData);
  return response.data;
}

async function updateEducation(educationId, educationData) {
  const response = await apiCall.put(`/users/education/${educationId}`, educationData);
  return response.data;
}

async function deleteEducation(educationId) {
  const response = await apiCall.delete(`/users/education/${educationId}`);
  return response.data;
}

async function changePassword(data) {
  const response = await apiCall.post("/users/change-password", data);
  return response.data;
}

async function checkApplicationStatus(jobId) {
  const response = await apiCall.get(`/jobs/application-status/${jobId}`);
  return response.data;
}

// Two-factor authentication (account settings, not the login step — see verifyTwoFactorLogin above)
async function getTwoFactorStatus() {
  const response = await apiCall.get("/users/2fa/status");
  return response.data;
}

async function setupTwoFactor() {
  const response = await apiCall.post("/users/2fa/setup");
  return response.data;
}

async function enableTwoFactor(token) {
  const response = await apiCall.post("/users/2fa/enable", { token });
  return response.data;
}

async function disableTwoFactor(password, code) {
  const response = await apiCall.post("/users/2fa/disable", { password, code });
  return response.data;
}

async function regenerateTwoFactorBackupCodes(token) {
  const response = await apiCall.post("/users/2fa/backup-codes/regenerate", { token });
  return response.data;
}
