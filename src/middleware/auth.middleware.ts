import type { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/appError"
import jwt from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.token

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string)
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
