import type { Request, Response, NextFunction } from "express"
import type { AppError } from "../utils/appError"
import logger from "../utils/logger"

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  const error = { ...err }
  error.message = err.message

  logger.error(`${req.method} ${req.path} - ${error.message}`, {
    stack: err.stack,
    statusCode: "statusCode" in err ? err.statusCode : 500,
  })

  let statusCode = "statusCode" in err ? err.statusCode : 500
  let message = error.message || "Something went wrong"
  const errors: any = "errors" in err ? err.errors : undefined

  if (err.name === "ValidationError") {
    statusCode = 400
    message = "Validation Error"
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Invalid token. Please log in again."
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Your token has expired. Please log in again."
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  })
}
