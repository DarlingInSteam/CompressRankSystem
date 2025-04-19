import { apiClient, apiClientCompressionService, apiClientMultipart } from './api.config';
import { ImageDTO, ImageStatistics, SortType, DateFilterType, SizeFilterType, UserQuota } from '../types/api.types';

const ImageService = {
  // Получение списка всех изображений
  getAllImages: async (): Promise<Record<string, ImageDTO>> => {
    try {
      const response = await apiClient.get('/api/images');
      
      // Handle both pagination and non-pagination responses
      if (response.data && typeof response.data === 'object') {
        if (response.data.images && typeof response.data.images === 'object') {
          // If it's paginated response, return images object
          return response.data.images as Record<string, ImageDTO>;
        } else if (!response.data.images) {
          // If it's direct map of images
          return response.data as Record<string, ImageDTO>;
        }
      }
      
      // Default to empty object if response format is unexpected
      return {};
    } catch (error) {
      console.error('Error fetching all images:', error);
      throw error;
    }
  },
  
  // Получение списка изображений с пагинацией
  getPaginatedImages: async (
    page: number = 0,
    size?: number,
    sort?: SortType,
    direction: 'asc' | 'desc' = 'desc'
  ): Promise<{
    images: Record<string, ImageDTO>;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }> => {
    try {
      const params: any = {
        page,
        direction
      };
      
      if (size) {
        params.size = size;
      }
      
      if (sort) {
        params.sort = sort;
      }
      
      const response = await apiClient.get('/api/images', { params });
      
      // If the response doesn't have the pagination format, convert it to the expected format
      if (!response.data.images && !response.data.page) {
        const images = response.data;
        return {
          images,
          page: 0,
          size: Object.keys(images).length,
          totalElements: Object.keys(images).length,
          totalPages: 1
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated images:', error);
      throw error;
    }
  },
  
  // Получение метаданных изображения по ID
  getImageMetadata: async (id: string): Promise<ImageDTO> => {
    const response = await apiClient.get<ImageDTO>(`/api/images/${id}/metadata`);
    return response.data;
  },
  
  // Получение самого изображения (данных)
  getImage: async (id: string, download: boolean = false): Promise<Blob> => {
    const response = await apiClient.get(`/api/images/${id}`, {
      responseType: 'blob',
      params: { download }
    });
    return response.data;
  },
  
  // Получение статистики по изображениям
  getImageStatistics: async (): Promise<Record<string, ImageStatistics>> => {
    try {
      // Исправлено: использовать правильный путь для статистики
      const response = await apiClient.get('/api/statistics');
      return response.data.statistics || {};
    } catch (error) {
      console.error('Error fetching image statistics:', error);
      
      // Fallback: если эндпоинт статистики недоступен, создаем базовую статистику
      // из имеющихся данных об изображениях
      try {
        const images = await ImageService.getAllImages();
        const fallbackStats: Record<string, ImageStatistics> = {};
        
        Object.entries(images).forEach(([imageId, image]) => {
          // Только если это не сжатая копия (нет originalImageId)
          if (!image.originalImageId) {
            fallbackStats[imageId] = {
              id: imageId,
              views: image.accessCount || 0,
              downloads: 0, // нет данных, ставим 0
              downloadCount: 0,
              viewCount: image.accessCount || 0,
              popularityScore: image.accessCount || 0
            };
          }
        });
        
        console.log('Using fallback statistics from images data');
        return fallbackStats;
      } catch (fallbackError) {
        console.error('Fallback statistics method failed:', fallbackError);
        return {};
      }
    }
  },
  
  // Синоним для getImageStatistics для обеспечения обратной совместимости
  getAllImageStatistics: async (): Promise<Record<string, ImageStatistics>> => {
    return ImageService.getImageStatistics();
  },

  // Получение статистики по конкретному изображению
  getImageStatisticById: async (imageId: string): Promise<ImageStatistics> => {
    try {
      // Исправлено: использовать правильный путь для статистики по ID
      const response = await apiClient.get(`/api/statistics/${imageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching statistics for image ${imageId}:`, error);
      
      // Fallback: если эндпоинт статистики недоступен, пробуем получить
      // базовую информацию из метаданных изображения
      try {
        const imageMetadata = await ImageService.getImageMetadata(imageId);
        return {
          id: imageId,
          views: imageMetadata.accessCount || 0,
          downloads: 0, // нет данных, ставим 0
          downloadCount: 0,
          viewCount: imageMetadata.accessCount || 0,
          popularityScore: imageMetadata.accessCount || 0
        };
      } catch (fallbackError) {
        // Если и это не удалось, возвращаем пустые данные
        return {
          id: `stats-fallback-${imageId}`, 
          views: 0,
          downloads: 0,
          downloadCount: 0, 
          viewCount: 0, 
          popularityScore: 0
        };
      }
    }
  },
  
  // Получение отфильтрованных или отсортированных изображений
  getFilteredImages: async (
    sort?: SortType, 
    dateFilter?: DateFilterType,
    sizeFilter?: SizeFilterType
  ): Promise<Record<string, ImageDTO>> => {
    const response = await apiClient.get('/api/images', { 
      params: { 
        sort,
        dateFilter,
        sizeFilter
      }
    });
    return response.data;
  },
  
  // Извлечение информации о пользователе из JWT токена
  getUserInfoFromToken: (): { username: string, role: string, userId: string } => {
    const token = localStorage.getItem('token');
    let username = '';
    let role = '';
    let userId = '';
    
    if (token) {
      try {
        // Декодируем JWT токен
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));
        
        // Извлекаем данные пользователя из токена
        username = decodedToken.username || '';
        role = decodedToken.role || '';
        userId = decodedToken.userId || decodedToken.sub || '';
        
        console.log('Extracted user info from token:', { username, role, userId });
      } catch (e) {
        console.error('Error extracting user info from token', e);
      }
    }
    
    return { username, role, userId };
  },
  
  // Загрузка нового изображения
  uploadImage: async (file: File): Promise<ImageDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Получаем информацию о пользователе из токена
    const { username, role, userId } = ImageService.getUserInfoFromToken();
    
    // Создаем объект с заголовками
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
      'X-User-Name': username,
      'X-User-Role': role,
      'X-User-Id': userId
    };
    
    console.log('Uploading image with user info headers:', { username, role, userId });
    
    // Используем специальный экземпляр для multipart/form-data запросов
    const response = await apiClientMultipart.post<ImageDTO>('/api/images', formData, {
      headers: headers,
    });
    return response.data;
  },

  // Удаление изображения
  deleteImage: async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/api/images/${id}`);
      return response.status === 204; // 204 No Content означает успешное удаление
    } catch (error) {
      console.error(`Error deleting image ${id}:`, error);
      throw error;
    }
  },

  // Сжатие изображения
  compressImage: async (id: string, compressionLevel: number = 5): Promise<ImageDTO> => {
    const response = await apiClientCompressionService.post<ImageDTO>(`/api/compression/${id}`, null, {
      params: { compressionLevel }
    });
    return response.data;
  },

  // Восстановление изображения
  restoreImage: async (id: string): Promise<ImageDTO> => {
    const response = await apiClientCompressionService.post<ImageDTO>(`/api/compression/${id}/restore`);
    return response.data;
  },

  // Получение оригинального размера изображения
  getOriginalImageSize: async (id: string): Promise<number> => {
    const response = await apiClientCompressionService.get<{originalSize: number}>(`/api/compression/${id}/original-size`);
    return response.data.originalSize;
  },
  
  // Получение оригинальных размеров для массива изображений
  getOriginalImageSizes: async (ids: string[]): Promise<Record<string, number>> => {
    if (!ids.length) return {};
    
    try {
      // Используем Promise.all для параллельных запросов
      const requests = ids.map(id => 
        apiClientCompressionService.get<{originalSize: number}>(`/api/compression/${id}/original-size`)
          .then(response => ({ id, size: response.data.originalSize }))
          .catch(error => {
            console.warn(`Failed to get original size for image ${id}:`, error);
            // Fallback to estimation if API fails
            return { id, size: null };
          })
      );
      
      const results = await Promise.all(requests);
      
      // Convert array to object
      const originalSizes: Record<string, number> = {};
      results.forEach(result => {
        if (result.size !== null) {
          originalSizes[result.id] = result.size;
        }
      });
      
      return originalSizes;
    } catch (error) {
      console.error('Failed to get original image sizes:', error);
      return {};
    }
  },

  // Вспомогательный метод для генерации URL изображения
  getImageUrl: (id: string, download: boolean = false): string => {
    const params = download ? '?download=true' : '';
    // Используем baseURL из конфигурации apiClient для согласованности
    return `${apiClient.defaults.baseURL}/api/images/${id}${params}`;
  },

  // Получение информации о квоте пользователя
  getUserQuota: async (): Promise<UserQuota> => {
    try {
      // Получаем информацию о пользователе из токена
      const { username, role, userId } = ImageService.getUserInfoFromToken();
      
      // Создаем объект с заголовками
      const headers: Record<string, string> = {
        'X-User-Name': username,
        'X-User-Role': role,
        'X-User-Id': userId
      };
      
      // Добавляем заголовки в запрос
      const response = await apiClient.get<UserQuota>('/api/images/quota', { headers });
      console.log('Quota API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user quota information:', error);
      
      // Return default quota values if API fails
      return {
        username: "unknown",
        userRole: "unknown",
        imagesUsed: 0,
        imagesQuota: 100,
        diskSpaceUsed: 0,
        diskSpaceQuota: 1024 * 1024 * 1024, // 1GB
        imagesQuotaPercentage: 0,
        diskQuotaPercentage: 0
      };
    }
  }
};

export default ImageService;