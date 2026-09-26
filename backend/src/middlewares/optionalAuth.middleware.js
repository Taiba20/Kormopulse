import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/**
 * Attaches req.user when a valid token is present, but never rejects the request.
 * Used on public endpoints that personalise their response for logged-in viewers.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded?._id).select("-password -refreshToken");
      if (user && !user.isSuspended) req.user = user;
    }
  } catch {
    // invalid or expired token: treat as anonymous
  }
  next();
};
