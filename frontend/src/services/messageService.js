import { apiCall } from "./apiBase";

export const messageService = {
  sendMessage,
  sendChatRequest,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse,
  getConversations,
  getConversation,
  sendChat,
};

async function getConversations() {
  return apiCall("get", "/messages/conversations");
}

async function getConversation(userId, params = {}) {
  return apiCall("get", `/messages/conversation/${userId}`, { params });
}

async function sendChat(to, content, relatedJob) {
  return apiCall("post", "/messages/chat", { to, content, relatedJob });
}

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