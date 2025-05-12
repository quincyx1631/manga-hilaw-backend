import type { Request, Response, NextFunction } from "express"
import { validationResult } from "express-validator"
import { supabase } from "../utils/supabase"
import { AppError } from "../utils/appError"
import logger from "../utils/logger"

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()))
    }

    const { email, password } = req.body

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return next(new AppError(error.message, 400))
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for verification.",
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Registration failed", 500))
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()))
    }

    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return next(new AppError("Invalid credentials", 401))
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Login failed", 500))
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error("Logout error:", error)
      return next(new AppError("Logout failed", 500))
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error: any) {
    next(new AppError(error.message || "Logout failed", 500))
  }
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      logger.error("Profile fetch error:", profileError)
      return next(new AppError("Error fetching user profile", 500))
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          username: profileData.username,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        },
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Failed to get user data", 500))
  }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    })

    if (error) {
      logger.error("Password reset request error:", error)
      return next(new AppError(error.message, 400))
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error: any) {
    next(new AppError(error.message || "Password reset request failed", 500))
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      logger.error("Password reset error:", error)
      return next(new AppError(error.message, 400))
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error: any) {
    next(new AppError(error.message || "Password reset failed", 500))
  }
}
