import http from "http";
import mongoose from "mongoose";
import { app } from "./app.js";
import { connectDB } from "./db/db.js";
import { initSocket } from "./socket.js";
import { startScheduler } from "./jobs/scheduler.js";

const PORT = process.env.PORT || 8000;

const startServer = () => {
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running at port : ${PORT}`);
  });
  return server;
};

connectDB()
  .then(() => {
    console.log("DB connected successfully");
    startServer();
    startScheduler();
  })
  .catch((error) => {
    console.log(`DB Connection failed: ${error.message}`);
    console.log("Starting Kormopulse in demo mode. DB-backed routes need MongoDB.");
    startServer();
  });

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
