import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { config } from "../config/index.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Assuming you have a User model to fetch user details
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        if (user.isSuspended) {
            throw new ApiError(403, "Your account has been suspended. Contact support for help.");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access token expired. Please refresh your token.");
        } else if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid access token");
        } else {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
    }
});

/** Restricts a route to the given roles. Must run after verifyJWT. */
export const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next(new ApiError(403, `This action is only available to: ${roles.join(", ")}`));
    }
    next();
};

/**
 * Blocks accounts whose email is still unverified, but only when
 * REQUIRE_EMAIL_VERIFICATION=true. Accounts created before verification existed
 * have no `emailVerified` field and are treated as verified.
 */
export const requireVerifiedEmail = (req, _res, next) => {
    if (config.requireEmailVerification && req.user?.emailVerified === false) {
        return next(new ApiError(403, "Please verify your email address to continue."));
    }
    next();
};
