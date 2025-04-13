// Интерфейсы для работы с API

// Интерфейс для изображения
export interface ImageDTO {
  id: string;
  originalFilename: string;
  contentType: string;
  size: number;
  objectName: string;
  compressionLevel: number;
  originalImageId: string | null;
  uploadedAt: string;
  lastAccessed: string | null;
  accessCount: number;
}

// Интерфейс для статистики изображения
export interface ImageStatistics {
  id: string;
  imageId: string;
  viewCount: number;
  downloadCount: number;
  popularityScore: number;
}

// Интерфейсы для обработки запросов
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  path?: string;
}

export type SortType = 'uploadedAt' | 'views' | 'downloads' | 'popularity' | 'size_asc' | 'size_desc';
export type DateFilterType = '' | 'today' | 'week' | 'month' | 'year';
export type SizeFilterType = '' | 'small' | 'medium' | 'large' | 'xlarge';