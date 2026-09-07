import dotenv from "dotenv";

dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

import userRoutes from "./routes/user.routes.js";
import jobRouter from "./routes/jobs.routes.js";
import companyRouter from "./routes/company.routes.js";
import messageRouter from "./routes/message.routes.js";
import demoRouter from "./routes/demo.routes.js";

import { connectDB } from "./db/db.js";

// Load environment variables


const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    name: "Kormopulse API",
    message: "Server is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/demo", demoRouter);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRouter);
app.use("/api/company", companyRouter);
app.use("/api/messages", messageRouter);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size allowed is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Only one file allowed.',
        error: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.',
        error: 'UNEXPECTED_FILE'
      });
    }
  }
  
  // Handle file filter errors (from our custom multer config)
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files are allowed. Please upload a valid image file.',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running at port : ${PORT}`);
  });
};

connectDB()
  .then(() => {
    console.log("DB connected successfully");
    startServer();
  })
  .catch((error) => {
    console.log(`DB Connection failed: ${error.message}`);
    console.log("Starting Kormopulse in demo mode. DB-backed routes need MongoDB.");
    startServer();
  });
