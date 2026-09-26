import { Router } from "express";
import { z } from "zod";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();
router.use(verifyJWT);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
const idParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") });

router.get("/", validate(listQuery, "query"), listNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", validate(idParam, "params"), markNotificationRead);
router.delete("/:id", validate(idParam, "params"), deleteNotification);

export default router;
