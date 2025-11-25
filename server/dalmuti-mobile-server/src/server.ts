import http from "http";
import app from "./app";
import { logger } from "./logger";
import { initializeWebSocketServer } from "./websocket/websocket_service";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const server = http.createServer(app);
const { wss } = initializeWebSocketServer(server);

server.listen(PORT, () => {
  logger.log(`HTTP server listening on http://localhost:${PORT}`, "Bootstrap");
  logger.log(`WebSocket server ready on ws://localhost:${PORT}/ws`, "Bootstrap");
});

server.on("error", (error) => {
  logger.error(`Server error: ${error.message}`, error.stack, "Bootstrap");
});

wss.on("close", () => {
  logger.log("WebSocket server closed", "Bootstrap");
});
