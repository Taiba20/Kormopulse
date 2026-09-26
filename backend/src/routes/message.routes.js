import { Router } from "express";
import { z } from "zod";
import {
  sendMessage,
  sendChatRequest,
  sendChatMessage,
  getConversations,
  getConversation,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse,
} from "../controllers/message.controller.js";
import { verifyJWT, requireVerifiedEmail } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// All message routes require authentication
router.use(verifyJWT);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const chatBody = z.object({
  to: objectId,
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
  relatedJob: objectId.optional(),
});

// Send messages
router.route("/send").post(requireVerifiedEmail, sendMessage);
router.route("/send-chat-request").post(requireVerifiedEmail, sendChatRequest);
router.route("/chat").post(requireVerifiedEmail, validate(chatBody), sendChatMessage);
router.route("/:messageId/respond").post(sendMessageResponse);

// Real-time chat
router.route("/conversations").get(getConversations);
router.route("/conversation/:userId").get(validate(z.object({ userId: objectId }), "params"), getConversation);

// Get messages
router.route("/").get(getMyMessages);
router.route("/unread-count").get(getUnreadMessageCount);

// Mark as read
router.route("/mark-all-read").patch(markAllMessagesAsRead);
router.route("/:messageId/read").patch(markMessageAsRead);

export default router;
