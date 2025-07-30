import type { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/appError"
import jwt from "jsonwebtoken"
import config from "../config"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401))
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      req.user = decoded
      next()
    } catch (err) {
      return next(new AppError("Invalid or expired token.", 401))
    }
  } catch (error) {
    next(new AppError("Authentication failed", 401))
  }
}

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403))
    }
    next()
  }
}
