import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { emitToUser } from "../socket.js";
import { tr, normalizeLanguage } from "./i18n.js";

const APP_NAME = "Kormopulse";

/**
 * Creates an in-app notification and pushes it to the user over the socket if they are online.
 * Never throws: a notification failure must not fail the request that triggered it.
 *
 * Pass `key` (an entry under `notify.` in utils/i18n.js) plus `params` and the text is written in the
 * recipient's own language; pass a literal `title`/`message` for text that is already final.
 */
export const notify = async (userId, { type = "system", key, params = {}, title, message = "", link = "", data } = {}) => {
  if (!userId || (!title && !key)) return null;
  try {
    if (key) {
      const recipient = await User.findById(userId).select("language");
      const lang = normalizeLanguage(recipient?.language);
      const values = { app: APP_NAME, ...params };
      title = tr(lang, `notify.${key}.title`, values);
      message = tr(lang, `notify.${key}.message`, values);
      // A caller-supplied `params.message` (a chat preview, a decline reason, job titles) wins; entries
      // without their own message text (e.g. newMessage) resolve to their key, so blank it out
      if (params.message) message = params.message;
      else if (message === `notify.${key}.message`) message = "";
    }
    const notification = await Notification.create({ user: userId, type, title, message, link, data });
    emitToUser(userId, "notification:new", notification.toObject());
    return notification;
  } catch (error) {
    console.error("[notify] failed:", error.message);
    return null;
  }
};
