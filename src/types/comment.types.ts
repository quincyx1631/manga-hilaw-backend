export interface Comment {
  id: string;
  user_id: string;
  manga_id: string;
  chapter_hid: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url?: string | null;
  replies?: Comment[];
}

export interface CommentInput {
  manga_id: string;
  chapter_hid: string;
  content: string;
  parent_id?: string;
}

export interface CommentResponse {
  success: boolean;
  data?: Comment[];
  comment?: Comment;
  message?: string;
  error?: string;
}
