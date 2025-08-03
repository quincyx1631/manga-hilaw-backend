import express from "express";
import { body, param } from "express-validator";
import {
  getComments,
  addComment,
  deleteComment,
} from "../controllers/comment.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/manga/:manga_id/chapter/:chapter_hid",
  [
    param("manga_id").notEmpty().withMessage("Manga ID is required"),
    param("chapter_hid").notEmpty().withMessage("Chapter HID is required"),
  ],
  getComments
);
router.post(
  "/",
  protect,
  [
    body("manga_id").notEmpty().withMessage("Manga ID is required"),
    body("chapter_hid").notEmpty().withMessage("Chapter HID is required"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Content must be between 1 and 1000 characters"),
    body("parent_id").optional().isUUID().withMessage("Invalid parent comment ID"),
  ],
  addComment
);
router.delete(
  "/:id",
  protect,
  [param("id").isUUID().withMessage("Invalid comment ID")],
  deleteComment
);

export default router;
