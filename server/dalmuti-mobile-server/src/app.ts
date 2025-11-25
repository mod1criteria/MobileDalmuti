import express, { Request, Response, NextFunction } from "express";
import { httpLoggerMiddleware } from "./logger/http-logger.middleware";
import { logger } from "./logger";

const app = express();

app.use(express.json());
app.use(httpLoggerMiddleware);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Dalmuti Mobile Server with TypeScript + Express!");
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use( (err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction, ) => {
    const statusCode = err.status ?? 500;
    logger.error(err.message, err.stack, "ExpressError");
    res.status(statusCode).json({
      message: statusCode >= 500 ? "Internal server error" : err.message,
    });
  },
);

export default app;
