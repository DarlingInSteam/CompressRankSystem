import { UserRole } from "../contexts/AuthContext";

// Типы сортировки, фильтрации и поиска
export type SortType = 'uploadedAt' | 'views' | 'downloads' | 'popularity' | 'size_asc' | 'size_desc' | 'accessCount';

export type DateFilterType = '' | 'today' | 'week' | 'month' | 'year';

export type SizeFilterType = '' | 'small' | 'medium' | 'large' | 'xlarge';

// Типы для работы с изображениями
export interface ImageDTO {
  id: string;
  originalFilename: string;
  contentType: string;
  size: number;
  compressionLevel: number;
  objectName: string;
  originalImageId?: string;
  uploadedAt?: string;
  lastAccessed?: string;
  accessCount?: number;
  userId?: string;
}

export interface ImageStatistics {
  views: number;
  downloads: number;
  lastViewed?: string;
  lastDownloaded?: string;
  downloadCount: number; // Изменено: больше не optional
  viewCount?: number;
  popularityScore?: number;
  id?: string; // Добавлено для совместимости
}

// Типы для системных настроек
export interface SystemSettingsDTO {
  settingKey: string;
  settingValue: string;
  description: string;
  settingGroup: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string;
}