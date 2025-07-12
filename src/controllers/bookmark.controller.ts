import { Request, Response } from "express"
import { validationResult } from "express-validator"
import { createClient } from "@supabase/supabase-js"
import { Bookmark, BookmarkInput, ReadingStatus } from "../types/bookmark.types"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getUsernameFromAuth = async (userId: string): Promise<string | undefined> => {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user) return undefined
  return data.user.user_metadata?.username || undefined
}

// @desc    Get user's bookmarks
// @route   GET /api/bookmarks
// @access  Private
export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    const { 
      page = "1", 
      limit = "20", 
      sort = "updated_at", 
      order = "desc",
      reading_status 
    } = req.query
    
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('bookmarks')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)

    if (reading_status) {
      query = query.eq('reading_status', reading_status)
    }

    const { data, error, count } = await query
      .order(sort as string, { ascending: order === 'asc' })
      .range(offset, offset + limitNum - 1)

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to fetch bookmarks",
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error("Get bookmarks error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Add bookmark
// @route   POST /api/bookmarks
// @access  Private
export const addBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const username = await getUsernameFromAuth(req.user.id)

    const {
      manga_id,
      manga_hid,
      manga_title,
      manga_slug,
      manga_cover_b2key,
      manga_status = 1,
      manga_country = 'jp',
      last_read_chapter,
      last_read_chapter_hid,
      reading_status = 'plan_to_read'  
    }: BookmarkInput = req.body

    const bookmarkData: Partial<Bookmark> = {
      user_id: req.user.id,
      username,
      manga_id,
      manga_hid,
      manga_title,
      manga_slug,
      manga_cover_b2key,
      manga_status,
      manga_country,
      last_read_chapter,
      last_read_chapter_hid,
      reading_status,  
      last_read_at: last_read_chapter ? new Date().toISOString() : undefined
    }

    // Use upsert to handle duplicate bookmarks
    const { data, error } = await supabase
      .from('bookmarks')
      .upsert(bookmarkData, { 
        onConflict: 'user_id,manga_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to add bookmark",
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      message: "Bookmark added successfully",
      data
    })
  } catch (error) {
    console.error("Add bookmark error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Update bookmark
// @route   PUT /api/bookmarks/:id
// @access  Private
export const updateBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const { id } = req.params
    const { last_read_chapter, last_read_chapter_hid }: { 
      last_read_chapter?: string
      last_read_chapter_hid?: string 
    } = req.body

    const updateData: Partial<Bookmark> = {
      last_read_chapter,
      last_read_chapter_hid,
      last_read_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update bookmark",
        error: error.message
      })
      return
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: "Bookmark not found"
      })
      return
    }

    res.status(200).json({
      success: true,
      message: "Bookmark updated successfully",
      data
    })
  } catch (error) {
    console.error("Update bookmark error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Update reading progress
// @route   PUT /api/bookmarks/:id/progress
// @access  Private
export const updateReadingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const { id } = req.params
    const { last_read_chapter, last_read_chapter_hid }: {
      last_read_chapter: string
      last_read_chapter_hid: string
    } = req.body

    const updateData: Partial<Bookmark> = {
      last_read_chapter,
      last_read_chapter_hid,
      last_read_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update reading progress",
        error: error.message
      })
      return
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: "Bookmark not found"
      })
      return
    }

    res.status(200).json({
      success: true,
      message: "Reading progress updated successfully",
      data
    })
  } catch (error) {
    console.error("Update reading progress error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:id
// @access  Private
export const removeBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const { id } = req.params

    // First check if bookmark exists and belongs to user
    const { data: existingBookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (fetchError || !existingBookmark) {
      res.status(404).json({
        success: false,
        message: "Bookmark not found"
      })
      return
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to remove bookmark",
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: "Bookmark removed successfully"
    })
  } catch (error) {
    console.error("Remove bookmark error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Check if manga is bookmarked
// @route   GET /api/bookmarks/check/:manga_id
// @access  Private
export const checkBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const { manga_id } = req.params

    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, last_read_chapter, last_read_at')
      .eq('user_id', req.user.id)
      .eq('manga_id', manga_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      res.status(400).json({
        success: false,
        message: "Failed to check bookmark status",
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      isBookmarked: !!data,
      bookmarkData: data || null
    })
  } catch (error) {
    console.error("Check bookmark error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Update reading status
// @route   PUT /api/bookmarks/:id/status
// @access  Private
export const updateReadingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      })
      return
    }

    const { id } = req.params
    const { reading_status }: { reading_status: string } = req.body

    // Validate reading_status
    const validStatuses = ['plan_to_read', 'reading', 'on_hold', 'dropped', 'completed']
    if (!validStatuses.includes(reading_status)) {
      res.status(400).json({
        success: false,
        message: "Invalid reading status"
      })
      return
    }

    const updateData: Partial<Bookmark> = {
      reading_status: reading_status as ReadingStatus
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update reading status",
        error: error.message
      })
      return
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: "Bookmark not found"
      })
      return
    }

    res.status(200).json({
      success: true,
      message: "Reading status updated successfully",
      data
    })
  } catch (error) {
    console.error("Update reading status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}