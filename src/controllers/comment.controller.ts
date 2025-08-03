import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { supabaseAdmin } from "../utils/supabase";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";
import { Comment, CommentInput } from "../types/comment.types";

// @desc    Get comments for a manga chapter
// @route   GET /api/comments/manga/:manga_id/chapter/:chapter_hid
// @access  Public
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()));
    }
    const { manga_id, chapter_hid } = req.params;
    const { data: comments, error } = await supabaseAdmin
      .from("comments")
      .select(`
        id,
        user_id,
        manga_id,
        chapter_hid,
        content,
        parent_id,
        created_at,
        updated_at
      `)
      .eq("manga_id", manga_id)
      .eq("chapter_hid", chapter_hid)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Comments fetch error:", error);
      return next(new AppError("Failed to fetch comments", 500));
    }
    if (!comments || comments.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
      });
      return;
    }
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      logger.error("Profiles fetch error:", profilesError);
      return next(new AppError("Failed to fetch user profiles", 500));
    }

    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    const transformedComments = comments.map((comment: any) => {
      const profile = profileMap.get(comment.user_id);
      return {
        id: comment.id,
        user_id: comment.user_id,
        manga_id: comment.manga_id,
        chapter_hid: comment.chapter_hid,
        content: comment.content,
        parent_id: comment.parent_id,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        username: profile?.username || "Anonymous",
        avatar_url: profile?.avatar_url || null,
      };
    });

    const topLevelComments: Comment[] = [];
    const repliesMap = new Map<string, Comment[]>();

    transformedComments.forEach((comment: Comment) => {
      if (comment.parent_id) {
        if (!repliesMap.has(comment.parent_id)) {
          repliesMap.set(comment.parent_id, []);
        }
        repliesMap.get(comment.parent_id)?.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    topLevelComments.forEach((comment) => {
      comment.replies = repliesMap.get(comment.id) || [];
      comment.replies.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    res.status(200).json({
      success: true,
      data: topLevelComments,
    });
  } catch (error: any) {
    logger.error("Get comments error:", error);
    next(new AppError(error.message || "Failed to fetch comments", 500));
  }
};

// @desc    Add a new comment
// @route   POST /api/comments
// @access  Private
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()));
    }
    const userId = req.user.id;
    const { manga_id, chapter_hid, content, parent_id }: CommentInput = req.body;

    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from("comments")
        .select("id")
        .eq("id", parent_id)
        .single();

      if (parentError || !parentComment) {
        return next(new AppError("Parent comment not found", 404));
      }
    }
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from("comments")
      .insert({
        user_id: userId,
        manga_id,
        chapter_hid,
        content: content.trim(),
        parent_id,
      })
      .select(`
        id,
        user_id,
        manga_id,
        chapter_hid,
        content,
        parent_id,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      logger.error("Comment insert error:", insertError);
      return next(new AppError("Failed to add comment", 500));
    }
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      logger.error("User profile fetch error:", profileError);
    }
    const transformedComment: Comment = {
      id: newComment.id,
      user_id: newComment.user_id,
      manga_id: newComment.manga_id,
      chapter_hid: newComment.chapter_hid,
      content: newComment.content,
      parent_id: newComment.parent_id,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      username: userProfile?.username || "Anonymous",
      avatar_url: userProfile?.avatar_url || null,
      replies: [],
    };

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: transformedComment,
    });
  } catch (error: any) {
    logger.error("Add comment error:", error);
    next(new AppError(error.message || "Failed to add comment", 500));
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError("Validation error", 400, errors.array()));
    }
    const { id } = req.params;
    const userId = req.user.id;
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (comment.user_id !== userId) {
      return next(new AppError("Not authorized to delete this comment", 403));
    }
    const { error: deleteError } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("Comment delete error:", deleteError);
      return next(new AppError("Failed to delete comment", 500));
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    logger.error("Delete comment error:", error);
    next(new AppError(error.message || "Failed to delete comment", 500));
  }
};
