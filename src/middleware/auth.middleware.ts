import type { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/appError"
import { supabase } from "../utils/supabase"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401))
    }

    const { data: user, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401))
    }

    if (!user.user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401))
    }

    req.user = user.user
    next()
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
