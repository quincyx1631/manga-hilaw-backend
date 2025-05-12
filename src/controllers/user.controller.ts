import type { Request, Response, NextFunction } from "express"
import { validationResult } from "express-validator"
import { supabase } from "../utils/supabase"
import { AppError } from "../utils/appError"
import logger from "../utils/logger"

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()))
    }

    const userId = req.user.id
    const { username, bio, avatar_url } = req.body

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username,
        bio,
        avatar_url,
        updated_at: new Date(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      logger.error("Profile update error:", error)
      return next(new AppError("Error updating profile", 500))
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: data,
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Profile update failed", 500))
  }
}

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      logger.error("Profile fetch error:", error)
      return next(new AppError("Error fetching profile", 500))
    }

    res.status(200).json({
      success: true,
      data: {
        profile: data,
      },
    })
  } catch (error: any) {
    next(new AppError(error.message || "Failed to get profile", 500))
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()))
    }
    const { password } = req.body
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      logger.error("Password change error:", error)
      return next(new AppError(error.message, 400))
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error: any) {
    next(new AppError(error.message || "Password change failed", 500))
  }
}
