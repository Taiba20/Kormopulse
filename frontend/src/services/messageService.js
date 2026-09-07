import { apiCall } from "./apiBase";

export const messageService = {
  sendMessage,
  sendChatRequest,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse
};

async function sendMessage(data) {
  return apiCall("post", "/messages/send", data);
}

async function sendChatRequest(data) {
  return apiCall("post", "/messages/send-chat-request", data);
}

async function getMyMessages(params = {}) {
  return apiCall("get", "/messages", { params });
}

async function markMessageAsRead(messageId) {
  return apiCall("patch", `/messages/${messageId}/read`);
}

async function markAllMessagesAsRead() {
  return apiCall("patch", "/messages/mark-all-read");
}

async function getUnreadMessageCount() {
  return apiCall("get", "/messages/unread-count");
}

async function sendMessageResponse(messageId, responseData) {
  return apiCall("post", `/messages/${messageId}/respond`, responseData);
}