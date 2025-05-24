export interface Bookmark {
  id: string
  user_id: string
  manga_id: string
  manga_hid: string
  manga_title: string
  manga_slug: string
  manga_cover_b2key?: string
  manga_status: number
  manga_country: string
  last_read_chapter?: string
  last_read_chapter_hid?: string
  last_read_at?: string
  created_at: string
  updated_at: string
}

export interface BookmarkInput {
  manga_id: string
  manga_hid: string
  manga_title: string
  manga_slug: string
  manga_cover_b2key?: string
  manga_status?: number
  manga_country?: string
  last_read_chapter?: string
  last_read_chapter_hid?: string
}

export interface BookmarkResponse {
  success: boolean
  message?: string
  data?: Bookmark | Bookmark[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
  errors?: any[]
}

export interface BookmarkCheckResponse {
  success: boolean
  isBookmarked: boolean
  bookmarkData?: {
    id: string
    last_read_chapter?: string
    last_read_at?: string
  } | null
  message?: string
  error?: string
}