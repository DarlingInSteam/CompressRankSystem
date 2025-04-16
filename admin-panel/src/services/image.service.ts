import { apiClient, apiClientCompressionService } from './api.config';
import { ImageDTO, ImageStatistics, SortType, DateFilterType, SizeFilterType } from '../types/api.types';

const ImageService = {
  // Получение списка всех изображений
  getAllImages: async (): Promise<Record<string, ImageDTO>> => {
    const response = await apiClient.get<Record<string, ImageDTO>>('/api/images');
    return response.data;
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
    const response = await apiClient.get('/api/images/statistics');
    return response.data.statistics;
  },
  
  // Синоним для getImageStatistics для обеспечения обратной совместимости
  getAllImageStatistics: async (): Promise<Record<string, ImageStatistics>> => {
    return ImageService.getImageStatistics();
  },

  // Получение статистики по конкретному изображению
  getImageStatisticById: async (imageId: string): Promise<ImageStatistics> => {
    const response = await apiClient.get(`/api/images/${imageId}/statistics`);
    return response.data;
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
  
  // Загрузка нового изображения
  uploadImage: async (file: File): Promise<ImageDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ImageDTO>('/api/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Удаление изображения
  deleteImage: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/api/images/${id}`);
    return response.status === 204; // 204 No Content означает успешное удаление
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

  // Вспомогательный метод для генерации URL изображения
  getImageUrl: (id: string, download: boolean = false): string => {
    const params = download ? '?download=true' : '';
    // Используем baseURL из конфигурации apiClient для согласованности
    return `${apiClient.defaults.baseURL}/api/images/${id}${params}`;
  }
};

export default ImageService;