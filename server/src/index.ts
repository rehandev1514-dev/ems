import http from "node:http";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { initRealtime } from "./realtime.js";
import { prisma } from "./prisma.js";

const app = createApp();
const server = http.createServer(app);
initRealtime(server);

server.listen(config.PORT, () => {
  console.log(`VertexEMS API listening on http://localhost:${config.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
