import { io } from "socket.io-client";
import { api_url } from "../../config";

// The API base ends in /api; Socket.io connects to the server root.
const SOCKET_URL = api_url.replace(/\/api\/?$/, "");

let socket = null;

/**
 * Opens (or reuses) the Socket.io connection for the current session. Authentication uses the
 * same httpOnly accessToken cookie as the REST API (withCredentials sends it automatically).
 *
 * Always reuses the existing instance once created, even while it is still connecting: closing
 * and recreating it whenever it wasn't *yet* connected (rather than only when actually
 * disconnected) tore down every in-flight handshake before it could complete, because React's
 * StrictMode invokes effects twice and multiple components (bell, chat) call this on mount.
 * socket.io-client already reconnects on its own; explicit teardown is only for logout.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const getExistingSocket = () => socket;
