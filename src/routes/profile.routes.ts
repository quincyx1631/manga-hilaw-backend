import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.middleware";
import {
  uploadProfileImage,
  updateProfile,
  getProfile,
  deleteProfileImage,
  upload,
} from "../controllers/profile.controller";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user profile
router.get("/", getProfile);

// Update profile information
router.put(
  "/",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio must be less than 500 characters"),
  ],
  updateProfile
);

// Upload profile image
router.post("/upload-image", upload.single("image"), uploadProfileImage);

// Delete profile image
router.delete("/delete-image", deleteProfileImage);

export default router; 