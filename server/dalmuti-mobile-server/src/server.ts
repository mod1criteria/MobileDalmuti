import http from "http";
import app from "./app";
import { logger } from "./logger";
import { websocketMng } from "./websocket/websocket_manager";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const server = http.createServer(app);
websocketMng.InitializeWebSocketServer(server);

server.listen(PORT, () => {
  logger.log(`HTTP server listening on http://localhost:${PORT}`, "Bootstrap");
  logger.log(`WebSocket server ready on ws://localhost:${PORT}/ws`, "Bootstrap");
});

server.on("error", (error) => {
  logger.error(`Server error: ${error.message}`, error.stack, "Bootstrap");
});