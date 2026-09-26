import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";
import { config } from "./config/index.js";

let io = null;
// userId -> number of open sockets (a user may have several tabs)
const online = new Map();

const readCookie = (header = "", name) => {
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const authenticate = async (socket) => {
  const token =
    socket.handshake.auth?.token || readCookie(socket.handshake.headers.cookie, "accessToken");
  if (!token) throw new Error("Unauthorized");
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded?._id).select("_id name role isSuspended");
  if (!user || user.isSuspended) throw new Error("Unauthorized");
  return user;
};

export const isOnline = (userId) => (online.get(String(userId)) || 0) > 0;

export const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

const setPresence = (userId, delta) => {
  const key = String(userId);
  const before = online.get(key) || 0;
  const after = Math.max(0, before + delta);
  if (after === 0) online.delete(key);
  else online.set(key, after);
  if ((before === 0) !== (after === 0)) {
    io?.to(`presence:${key}`).emit("presence:update", { userId: key, online: after > 0 });
  }
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticate(socket);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.data.user._id);
    socket.join(`user:${userId}`);
    setPresence(userId, +1);

    // Typing indicator: relayed only to the addressed user
    socket.on("typing", ({ to, isTyping } = {}) => {
      if (!to || String(to) === userId) return;
      io.to(`user:${to}`).emit("typing", { from: userId, isTyping: Boolean(isTyping) });
    });

    // Subscribe to online/offline changes for a list of users and get the current state
    socket.on("presence:watch", (ids = [], ack) => {
      const list = Array.isArray(ids) ? ids.slice(0, 200).map(String) : [];
      list.forEach((id) => socket.join(`presence:${id}`));
      if (typeof ack === "function") ack({ online: list.filter(isOnline) });
    });

    socket.on("disconnect", () => setPresence(userId, -1));
  });

  return io;
};

export const closeSocket = async () => {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
    io = null;
    online.clear();
  }
};
