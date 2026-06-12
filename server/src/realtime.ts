import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { verifyAccessToken } from "./utils/crypto.js";

let io: Server | undefined;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyAccessToken(String(token));
      socket.data.user = payload;
      socket.join(`employee:${payload.employeeId}`);
      socket.join(`role:${payload.role}`);
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { employeeId: socket.data.user.employeeId });
  });

  return io;
}

export function emitToEmployee(employeeId: string, event: string, payload: unknown) {
  io?.to(`employee:${employeeId}`).emit(event, payload);
}

export function emitToRole(role: string, event: string, payload: unknown) {
  io?.to(`role:${role}`).emit(event, payload);
}
