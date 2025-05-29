import express from "express"
import { body } from "express-validator"
import { register, login, logout, getCurrentUser, /*forgotPassword, resetPassword*/ } from "../controllers/auth.controller"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
  ],
  register,
)
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login,
)
router.post("/logout", protect, logout)
router.get("/me", protect, getCurrentUser)
// router.post("/forgot-password", [body("email").isEmail().withMessage("Please provide a valid email")], forgotPassword)
// router.post(
//   "/reset-password",
//   [body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")],
//   resetPassword,
// )

export default router
