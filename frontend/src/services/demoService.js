import { apiCall } from "./apiBase";

export function getDemoOverview() {
  return apiCall("get", "/demo/overview");
}

export async function getWorkflowPreviews() {
  const overview = await getDemoOverview();
  return overview.workflowPreviews || [];
}