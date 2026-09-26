import { apiCall } from "./apiBase";
import { api_url } from "../../config";

export const interviewService = {
  propose,
  getMine,
  confirm,
  decline,
  cancel,
  complete,
  icsUrl,
};

async function propose(data) {
  return apiCall("post", "/interviews", data);
}

async function getMine() {
  return apiCall("get", "/interviews/mine");
}

async function confirm(id, slotIndex) {
  return apiCall("post", `/interviews/${id}/confirm`, { slotIndex });
}

async function decline(id, reason) {
  return apiCall("post", `/interviews/${id}/decline`, { reason });
}

async function cancel(id) {
  return apiCall("post", `/interviews/${id}/cancel`);
}

async function complete(id) {
  return apiCall("post", `/interviews/${id}/complete`);
}

function icsUrl(id) {
  return `${api_url}/interviews/${id}/ics`;
}
