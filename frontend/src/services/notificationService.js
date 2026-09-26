import { apiCall } from "./apiBase";

export const notificationService = {
  list,
  getUnreadCount,
  markRead,
  markAllRead,
  remove,
};

async function list(params = {}) {
  return apiCall("get", "/notifications", { params });
}

async function getUnreadCount() {
  return apiCall("get", "/notifications/unread-count");
}

async function markRead(id) {
  return apiCall("patch", `/notifications/${id}/read`);
}

async function markAllRead() {
  return apiCall("patch", "/notifications/read-all");
}

async function remove(id) {
  return apiCall("delete", `/notifications/${id}`);
}
