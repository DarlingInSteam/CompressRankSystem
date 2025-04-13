import apiClient from './api.config';
import { ImageDTO, ImageStatistics, SortType, DateFilterType, SizeFilterType } from '../types/api.types';

const ImageService = {
  // Получение списка всех изображений
  getAllImages: async (): Promise<Record<string, ImageDTO>> => {
    const response = await apiClient.get<Record<string, ImageDTO>>('/images');
    return response.data;
  },

  // Получение метаданных изображения по ID
  getImageMetadata: async (id: string): Promise<ImageDTO> => {
    const response = await apiClient.get<ImageDTO>(`/images/${id}/metadata`);
    return response.data;
  },
  
  // Получение самого изображения (данных)
  getImage: async (id: string, download: boolean = false): Promise<Blob> => {
    const response = await apiClient.get(`/images/${id}`, {
      responseType: 'blob',
      params: { download }
    });
    return response.data;
  },

  // Загрузка нового изображения
  uploadImage: async (file: File): Promise<ImageDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ImageDTO>('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Удаление изображения
  deleteImage: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/images/${id}`);
    return response.status === 204; // 204 No Content означает успешное удаление
  },

  // Сжатие изображения
  compressImage: async (id: string, compressionLevel: number = 5): Promise<ImageDTO> => {
    const response = await apiClient.post<ImageDTO>(`/compression/${id}`, null, {
      params: { compressionLevel }
    });
    return response.data;
  },

  // Вспомогательный метод для генерации URL изображения
  getImageUrl: (id: string, download: boolean = false): string => {
    const params = download ? '?download=true' : '';
    // Используем baseURL из конфигурации apiClient для согласованности
    return `${apiClient.defaults.baseURL}/images/${id}${params}`;
  }
};

export default ImageService;