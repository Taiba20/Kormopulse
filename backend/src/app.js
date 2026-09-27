import dotenv from "dotenv";

dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi.js";

import { config } from "./config/index.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

import userRoutes from "./routes/user.routes.js";
import jobRouter from "./routes/jobs.routes.js";
import companyRouter from "./routes/company.routes.js";
import messageRouter from "./routes/message.routes.js";
import demoRouter from "./routes/demo.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import applicationRouter from "./routes/application.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import alertRouter from "./routes/alert.routes.js";
import savedSearchRouter from "./routes/savedSearch.routes.js";
import reviewRouter from "./routes/review.routes.js";
import aiRouter from "./routes/ai.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

// Behind a reverse proxy (Render, Vercel, nginx) the real client IP is in X-Forwarded-For.
if (config.isProduction) {
  app.set("trust proxy", 1);
}

// Security headers. This is a JSON API, so cross-origin reads must stay allowed.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests (curl, server-to-server) have no Origin header
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));
app.use(cookieParser());

const health = (req, res) => {
  res.status(200).json({
    name: "Kormopulse API",
    message: "Server is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    timestamp: new Date().toISOString(),
  });
};
app.get("/api/health", health);
app.get("/health", health);

app.get("/api/openapi.json", (req, res) => res.json(openApiSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "Kormopulse API Docs" }));

app.use("/api", apiLimiter);

app.use("/api/demo", demoRouter);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRouter);
app.use("/api/company", companyRouter);
app.use("/api/messages", messageRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/interviews", interviewRouter);
app.use("/api/alerts", alertRouter);
app.use("/api/saved-searches", savedSearchRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);

// Global error handler
app.use((error, req, res, next) => {
  if (!config.isTest) console.error("Error:", error);

  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    const multerMessages = {
      LIMIT_FILE_SIZE: ["File too large. Maximum size allowed is 5MB.", "FILE_TOO_LARGE"],
      LIMIT_FILE_COUNT: ["Too many files. Only one file allowed.", "TOO_MANY_FILES"],
      LIMIT_UNEXPECTED_FILE: ["Unexpected file field.", "UNEXPECTED_FILE"],
    };
    const [message, code] = multerMessages[error.code] || [error.message, "UPLOAD_ERROR"];
    return res.status(400).json({ message, error: code });
  }

  // Handle file filter errors (from our custom multer config)
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({
      message: "Only image files are allowed. Please upload a valid image file.",
      error: "INVALID_FILE_TYPE",
    });
  }

  // ApiError uses `statusCode`; libraries such as body-parser use `status`.
  const candidate = error.statusCode || error.status;
  const statusCode = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    ...(error.errors?.length ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// 404 handler (registered after every route)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

export { app };
export default app;
