import { Router } from "express";
import {
  sendMessage,
  sendChatRequest,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All message routes require authentication
router.use(verifyJWT);

// Send messages
router.route("/send").post(sendMessage);
router.route("/send-chat-request").post(sendChatRequest);
router.route("/:messageId/respond").post(sendMessageResponse);

// Get messages
router.route("/").get(getMyMessages);
router.route("/unread-count").get(getUnreadMessageCount);

// Mark as read
router.route("/:messageId/read").patch(markMessageAsRead);
router.route("/mark-all-read").patch(markAllMessagesAsRead);

export default router;