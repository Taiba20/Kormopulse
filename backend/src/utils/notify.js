import { Notification } from "../models/notification.model.js";
import { emitToUser } from "../socket.js";

/**
 * Creates an in-app notification and pushes it to the user over the socket if they are online.
 * Never throws: a notification failure must not fail the request that triggered it.
 */
export const notify = async (userId, { type = "system", title, message = "", link = "", data } = {}) => {
  if (!userId || !title) return null;
  try {
    const notification = await Notification.create({ user: userId, type, title, message, link, data });
    emitToUser(userId, "notification:new", notification.toObject());
    return notification;
  } catch (error) {
    console.error("[notify] failed:", error.message);
    return null;
  }
};
