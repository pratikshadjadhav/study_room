import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? "Internal server error";

  logger.error(
    {
      status,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    },
    message
  );

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}

