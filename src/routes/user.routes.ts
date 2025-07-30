import express from "express"
import { body } from "express-validator"
import { updateProfile, getProfile, changePassword } from "../controllers/user.controller"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// All user routes require authentication
router.use(protect)

router.get("/profile", getProfile)
router.put(
  "/profile",
  [
    body("username").optional().isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    body("bio").optional().isLength({ max: 500 }).withMessage("Bio must not exceed 500 characters"),
    body("avatar_url").optional().isURL().withMessage("Avatar URL must be valid"),
  ],
  updateProfile,
)
router.put(
  "/change-password",
  [
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  ],
  changePassword,
)

export default router
