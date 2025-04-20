/**
 * Enum for manga status
 */
export enum MangaStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
  CANCELED = 'canceled'
}

/**
 * Interface representing a page entity
 */
export interface Page {
  id: string;
  chapterId: string;
  pageNumber: number;
  imageId: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface representing a chapter entity
 */
export interface Chapter {
  id: string;
  volumeId: string;
  chapterNumber: number;
  title: string;
  pages?: Page[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  viewCount: number;
  pageCount?: number;
}

/**
 * Interface representing a volume entity
 */
export interface Volume {
  id: string;
  mangaId: string;
  volumeNumber: number;
  title: string;
  coverImageId?: string;
  coverImageUrl?: string;
  chapters?: Chapter[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  viewCount: number;
  chapterCount?: number;
  pageCount?: number;
}

/**
 * Interface representing a manga entity
 */
export interface Manga {
  id: string;
  title: string;
  description: string;
  author: string;
  artist?: string;
  previewImageId?: string;
  coverImageUrl?: string;
  volumes?: Volume[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
  published: boolean;
  status: MangaStatus | string;
  genres?: string;
  viewCount: number;
  volumeCount?: number;
  chapterCount?: number;
  pageCount?: number;
}

/**
 * Interface for manga filter options
 */
export interface MangaFilter {
  status?: MangaStatus;
  genre?: string;
  published?: boolean;
  search?: string;
}

/**
 * Interface for paginated responses
 */
export interface MangaPaginatedResponse {
  mangas: Manga[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}