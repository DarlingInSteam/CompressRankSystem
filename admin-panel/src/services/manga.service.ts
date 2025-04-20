import axios from 'axios';
import { apiClient as gatewayClient } from './api.config.gateway';
import { Manga, Volume, Chapter, Page, MangaPaginatedResponse } from '../types/manga.types';

// Use gatewayClient directly instead of creating a new instance with potential URL issues
const apiClient = gatewayClient;

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Service for managing manga entities
 */
class MangaService {
  // Manga endpoints
  async getAllMangas(page = 0, size = 10, sort = 'createdAt', direction = 'desc'): Promise<MangaPaginatedResponse> {
    const response = await apiClient.get('/api/manga', { 
      params: { page, size, sort, direction } 
    });
    return response.data;
  }

  async searchMangas(query: string, page = 0, size = 10): Promise<MangaPaginatedResponse> {
    const response = await apiClient.get('/api/manga/search', { 
      params: { query, page, size } 
    });
    return response.data;
  }

  async getMangasByGenre(genre: string, page = 0, size = 10): Promise<MangaPaginatedResponse> {
    const response = await apiClient.get(`/api/manga/genre/${genre}`, { 
      params: { page, size } 
    });
    return response.data;
  }
  
  async getPublishedMangas(page = 0, size = 10): Promise<MangaPaginatedResponse> {
    const response = await apiClient.get('/api/manga/published', { 
      params: { page, size } 
    });
    return response.data;
  }

  async getManga(id: string, includeVolumes = false): Promise<Manga> {
    const response = await apiClient.get(`/api/manga/${id}`, { 
      params: { includeVolumes } 
    });
    return response.data;
  }

  async createManga(manga: Partial<Manga>): Promise<Manga> {
    console.log("Creating manga with data:", JSON.stringify(manga, null, 2));
    try {
      const response = await apiClient.post('/api/manga', manga);
      return response.data;
    } catch (error) {
      console.error("Error creating manga:", error);
      console.error("Request that failed:", manga);
      throw error;
    }
  }

  async updateManga(id: string, manga: Partial<Manga>): Promise<Manga> {
    const response = await apiClient.put(`/api/manga/${id}`, manga);
    return response.data;
  }

  async deleteManga(id: string): Promise<void> {
    await apiClient.delete(`/api/manga/${id}`);
  }

  async setMangaPreviewImage(mangaId: string, imageId: string): Promise<Manga> {
    const response = await apiClient.put(`/api/manga/${mangaId}/preview-image/${imageId}`);
    return response.data;
  }

  // Volume endpoints
  async getVolume(id: string, includeChapters = false): Promise<Volume> {
    const response = await apiClient.get(`/api/manga/volumes/${id}`, { 
      params: { includeChapters } 
    });
    return response.data;
  }

  async getVolumesByMangaId(mangaId: string): Promise<Volume[]> {
    const response = await apiClient.get(`/api/manga/volumes/manga/${mangaId}`);
    return response.data;
  }

  async createVolume(mangaId: string, volume: Partial<Volume>): Promise<Volume> {
    const response = await apiClient.post(`/api/manga/volumes/${mangaId}`, volume);
    return response.data;
  }

  async updateVolume(id: string, volume: Partial<Volume>): Promise<Volume> {
    const response = await apiClient.put(`/api/manga/volumes/${id}`, volume);
    return response.data;
  }

  async deleteVolume(id: string): Promise<void> {
    await apiClient.delete(`/api/manga/volumes/${id}`);
  }

  async setVolumeCoverImage(volumeId: string, imageId: string): Promise<Volume> {
    const response = await apiClient.put(`/api/manga/volumes/${volumeId}/cover-image/${imageId}`);
    return response.data;
  }

  // Chapter endpoints
  async getChapter(id: string, includePages = false): Promise<Chapter> {
    const response = await apiClient.get(`/api/manga/chapters/${id}`, { 
      params: { includePages } 
    });
    return response.data;
  }

  async getChaptersByVolumeId(volumeId: string): Promise<Chapter[]> {
    const response = await apiClient.get(`/api/manga/chapters/volume/${volumeId}`);
    return response.data;
  }

  async getChaptersByMangaId(mangaId: string): Promise<Chapter[]> {
    const response = await apiClient.get(`/api/manga/chapters/manga/${mangaId}`);
    return response.data;
  }

  async createChapter(volumeId: string, chapter: Partial<Chapter>): Promise<Chapter> {
    const response = await apiClient.post(`/api/manga/chapters/${volumeId}`, chapter);
    return response.data;
  }

  async updateChapter(id: string, chapter: Partial<Chapter>): Promise<Chapter> {
    const response = await apiClient.put(`/api/manga/chapters/${id}`, chapter);
    return response.data;
  }

  async deleteChapter(id: string): Promise<void> {
    await apiClient.delete(`/api/manga/chapters/${id}`);
  }

  // Page endpoints
  async getPage(id: string): Promise<Page> {
    const response = await apiClient.get(`/api/manga/pages/${id}`);
    return response.data;
  }

  async getPagesByChapterId(chapterId: string): Promise<Page[]> {
    const response = await apiClient.get(`/api/manga/pages/chapter/${chapterId}`);
    return response.data;
  }

  async createPage(chapterId: string, page: Partial<Page>): Promise<Page> {
    const response = await apiClient.post(`/api/manga/pages/${chapterId}`, page);
    return response.data;
  }

  async uploadPage(chapterId: string, pageNumber: number, file: File): Promise<Page> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageNumber', pageNumber.toString());
    
    const response = await axios.post(`${gatewayClient.defaults.baseURL}/api/images/pages/${chapterId}/upload`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  }

  async updatePage(id: string, page: Partial<Page>): Promise<Page> {
    const response = await apiClient.put(`/api/manga/pages/${id}`, page);
    return response.data;
  }

  async deletePage(id: string): Promise<void> {
    await apiClient.delete(`/api/manga/pages/${id}`);
  }

  async reorderPages(chapterId: string, pageIds: string[]): Promise<Page[]> {
    const response = await apiClient.put(`/api/manga/pages/reorder/${chapterId}`, pageIds);
    return response.data;
  }
}

export default new MangaService();