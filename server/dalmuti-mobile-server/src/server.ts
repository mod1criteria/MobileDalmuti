import http from "http";
import app from "./app";
import { logger } from "./logger";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const server = http.createServer(app);

server.listen(PORT, () => {
    logger.log(`Server listening on http://localhost:${PORT}`, "Bootstrap");
});

server.on("error", (error) => {
    logger.error(`Server error: ${error.message}`, error.stack, "Bootstrap");
});
