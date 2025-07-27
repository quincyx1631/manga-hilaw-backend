import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import multer from "multer";
import { supabase, supabaseAdmin } from "../utils/supabase";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return next(new AppError("No file uploaded", 400));
    }

    // Generate unique filename
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${userId}/profile-${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("profile-images")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Storage upload error:", uploadError);
      return next(new AppError("Failed to upload image", 500));
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("profile-images")
      .getPublicUrl(fileName);

    // Check if profile exists first using admin client
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    let profileData;
    let profileError;

    if (checkError && checkError.code === "PGRST116") {
      // Profile doesn't exist, create it with the image using admin client
      logger.info(`Creating new profile for user ${userId} with image`);
      
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          username: req.user.username || req.user.email,
          email: req.user.email,
          avatar_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (createError) {
        logger.error("Profile creation error:", createError);
        return next(new AppError("Failed to create profile", 500));
      }

      profileData = newProfile;
    } else if (checkError) {
      logger.error("Profile check error:", checkError);
      return next(new AppError("Failed to check profile", 500));
    } else {
      // Profile exists, update it with the new image using admin client
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        logger.error("Profile update error:", updateError);
        return next(new AppError("Failed to update profile", 500));
      }

      profileData = updatedProfile;
    }

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        avatar_url: urlData.publicUrl,
        profile: profileData,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || "Image upload failed", 500));
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()));
    }

    const userId = req.user.id;
    const { username, bio } = req.body;

    // First check if profile exists using admin client
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    let data;
    let error;

    if (checkError && checkError.code === "PGRST116") {
      // Profile doesn't exist, create it using admin client
      logger.info(`Creating new profile for user ${userId}`);
      
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          username,
          email: req.user.email,
          bio,
        })
        .select()
        .single();

      if (createError) {
        logger.error("Profile creation error:", createError);
        return next(new AppError("Error creating profile", 500));
      }

      data = newProfile;
    } else if (checkError) {
      logger.error("Profile check error:", checkError);
      return next(new AppError("Error checking profile", 500));
    } else {
      // Profile exists, update it using admin client
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          username,
          bio,
          updated_at: new Date(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        logger.error("Profile update error:", updateError);
        return next(new AppError("Error updating profile", 500));
      }

      data = updatedProfile;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: data,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || "Profile update failed", 500));
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Try to get existing profile using admin client
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // If profile doesn't exist, return basic user info without profile
    if (error && error.code === "PGRST116") {
      logger.info(`No profile found for user ${userId}, returning basic info`);
      
      const basicProfile = {
        id: userId,
        username: req.user.username || req.user.email,
        email: req.user.email,
        bio: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: {
          profile: basicProfile,
        },
      });
      return;
    } else if (error) {
      logger.error("Profile fetch error:", error);
      return next(new AppError("Error fetching profile", 500));
    }

    res.status(200).json({
      success: true,
      data: {
        profile: data,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || "Failed to get profile", 500));
  }
};

export const deleteProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Get current profile to find the image path using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      logger.error("Profile fetch error:", profileError);
      return next(new AppError("Error fetching profile", 500));
    }

    if (!profile.avatar_url) {
      return next(new AppError("No profile image to delete", 400));
    }

    // Extract filename from URL
    const urlParts = profile.avatar_url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const fullPath = `${userId}/${fileName}`;

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from("profile-images")
      .remove([fullPath]);

    if (deleteError) {
      logger.error("Storage delete error:", deleteError);
      return next(new AppError("Failed to delete image", 500));
    }

    // Update profile to remove avatar URL using admin client
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      logger.error("Profile update error:", updateError);
      return next(new AppError("Failed to update profile", 500));
    }

    res.status(200).json({
      success: true,
      message: "Profile image deleted successfully",
      data: {
        profile: updatedProfile,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || "Image deletion failed", 500));
  }
};

// Export multer middleware for use in routes
export { upload }; 