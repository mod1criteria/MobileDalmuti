import { Request, Response, NextFunction } from "express";
import { logger } from ".";

export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const context = "HTTP";

  logger.log(`${req.method} ${req.originalUrl}`, context);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message, undefined, context);
    } else if (res.statusCode >= 400) {
      logger.warn(message, context);
    } else {
      logger.log(message, context);
    }
  });

  res.on("close", () => {
    if (!res.writableFinished) {
      const duration = Date.now() - start;
      logger.warn(`${req.method} ${req.originalUrl} connection closed early after ${duration}ms`, context);
    }
  });

  next();
}
