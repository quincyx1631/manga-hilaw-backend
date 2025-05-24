import express from "express"
import { body, param } from "express-validator"
import { 
  getBookmarks, 
  addBookmark, 
  updateBookmark, 
  removeBookmark, 
  checkBookmark,
  updateReadingProgress 
} from "../controllers/bookmark.controller"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// All bookmark routes require authentication
router.use(protect)

// GET /api/bookmarks - Get user's bookmarks
router.get("/", getBookmarks)

// POST /api/bookmarks - Add bookmark
router.post(
  "/",
  [
    body("manga_id").notEmpty().withMessage("Manga ID is required"),
    body("manga_hid").notEmpty().withMessage("Manga HID is required"),
    body("manga_title").notEmpty().withMessage("Manga title is required"),
    body("manga_slug").notEmpty().withMessage("Manga slug is required"),
    body("manga_cover_b2key").optional().isString(),
    body("manga_status").optional().isInt({ min: 0, max: 4 }),
    body("manga_country").optional().isLength({ min: 2, max: 2 }),
    body("last_read_chapter").optional().isString(),
    body("last_read_chapter_hid").optional().isString(),
  ],
  addBookmark
)

// PUT /api/bookmarks/:id - Update bookmark
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid bookmark ID"),
    body("last_read_chapter").optional().isString(),
    body("last_read_chapter_hid").optional().isString(),
  ],
  updateBookmark
)

// PUT /api/bookmarks/:id/progress - Update reading progress
router.put(
  "/:id/progress",
  [
    param("id").isUUID().withMessage("Invalid bookmark ID"),
    body("last_read_chapter").notEmpty().withMessage("Chapter number is required"),
    body("last_read_chapter_hid").notEmpty().withMessage("Chapter HID is required"),
  ],
  updateReadingProgress
)

// DELETE /api/bookmarks/:id - Remove bookmark
router.delete(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid bookmark ID"),
  ],
  removeBookmark
)

// GET /api/bookmarks/check/:manga_id - Check if manga is bookmarked
router.get(
  "/check/:manga_id",
  [
    param("manga_id").notEmpty().withMessage("Manga ID is required"),
  ],
  checkBookmark
)

export default router