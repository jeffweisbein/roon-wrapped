import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const err = new AppError(404, `Route ${req.originalUrl} not found`);
  next(err);
}

export function errorLogger(
  err: AppError,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  next(err);
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      isOperational: err.isOperational,
    }),
  });
}
