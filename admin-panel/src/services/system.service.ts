import { apiClient } from './api.config';
import { SystemSettingsDTO } from '../types/api.types';

/**
 * Сервис для работы с системными настройками
 */
class SystemService {
    /**
     * Получить все системные настройки
     */
    async getAllSettings(): Promise<SystemSettingsDTO[]> {
        const response = await apiClient.get<SystemSettingsDTO[]>('/api/auth/system/settings');
        return response.data;
    }

    /**
     * Получить настройки по группе
     */
    async getSettingsByGroup(group: string): Promise<SystemSettingsDTO[]> {
        const response = await apiClient.get<SystemSettingsDTO[]>(`/api/auth/system/settings/group/${group}`);
        return response.data;
    }

    /**
     * Получить настройку по ключу
     */
    async getSettingByKey(key: string): Promise<SystemSettingsDTO> {
        const response = await apiClient.get<SystemSettingsDTO>(`/api/auth/system/settings/${key}`);
        return response.data;
    }

    /**
     * Создать или обновить настройку
     */
    async createOrUpdateSetting(setting: SystemSettingsDTO): Promise<SystemSettingsDTO> {
        const response = await apiClient.post<SystemSettingsDTO>('/api/auth/system/settings', setting);
        return response.data;
    }

    /**
     * Обновить несколько настроек одновременно
     */
    async updateSettings(settings: SystemSettingsDTO[]): Promise<SystemSettingsDTO[]> {
        const response = await apiClient.put<SystemSettingsDTO[]>('/api/auth/system/settings/batch', settings);
        return response.data;
    }

    /**
     * Удалить настройку
     */
    async deleteSetting(key: string): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/api/auth/system/settings/${key}`);
        return response.data;
    }

    /**
     * Получить лимиты файлов (публичный доступ)
     */
    async getFileLimits(): Promise<Record<string, string>> {
        const response = await apiClient.get<Record<string, string>>('/api/auth/system/settings/public/file-limits');
        return response.data;
    }

    /**
     * Получить категории изображений (публичный доступ)
     */
    async getImageCategories(): Promise<string[]> {
        const response = await apiClient.get<{ categories: string[] }>('/api/auth/system/settings/public/image-categories');
        return response.data.categories;
    }
}

export const systemService = new SystemService();