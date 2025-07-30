import { Request, Response, NextFunction } from "express"
import { supabase } from "../utils/supabase"
import { AppError } from "../utils/appError"
import jwt from "jsonwebtoken"
import config from "../config"

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  if (!email || !password || !req.body.username) {
    return next(new AppError("Please provide email, password and username", 400))
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: req.body.username
        }
      }
    })

    if (error) {
      return next(new AppError(error.message, 400))
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Failed to register user", 500))
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400))
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return next(new AppError(error.message, 400))
    }

    const token = jwt.sign(
      {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || null,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    )

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || null,
        },
        token: token,
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Failed to login", 500))
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return next(new AppError(error.message, 400))
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    })
  } catch (error: any) {
    next(new AppError(error.message || "Failed to logout", 500))
  }
}