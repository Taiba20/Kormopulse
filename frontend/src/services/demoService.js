import { apiCall } from "./apiBase";

export function getDemoOverview() {
  return apiCall("get", "/demo/overview");
}