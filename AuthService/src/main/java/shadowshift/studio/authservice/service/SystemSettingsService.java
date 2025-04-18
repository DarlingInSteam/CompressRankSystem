package shadowshift.studio.authservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import shadowshift.studio.authservice.dto.SystemSettingsDto;
import shadowshift.studio.authservice.model.SystemSettings;
import shadowshift.studio.authservice.repository.SystemSettingsRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Сервис для управления системными настройками
 */
@Service
public class SystemSettingsService {

    private final SystemSettingsRepository systemSettingsRepository;

    @Autowired
    public SystemSettingsService(SystemSettingsRepository systemSettingsRepository) {
        this.systemSettingsRepository = systemSettingsRepository;
    }
    
    /**
     * Получить все настройки системы
     */
    public List<SystemSettingsDto> getAllSettings() {
        return systemSettingsRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Получить настройки по группе
     */
    public List<SystemSettingsDto> getSettingsByGroup(String group) {
        return systemSettingsRepository.findBySettingGroup(group).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Получить настройку по ключу
     */
    public SystemSettingsDto getSettingByKey(String key) {
        Optional<SystemSettings> setting = systemSettingsRepository.findById(key);
        return setting.map(this::mapToDto).orElse(null);
    }
    
    /**
     * Создать или обновить настройку
     */
    public SystemSettingsDto createOrUpdateSetting(SystemSettingsDto settingsDto) {
        SystemSettings settings = mapToEntity(settingsDto);
        settings = systemSettingsRepository.save(settings);
        return mapToDto(settings);
    }
    
    /**
     * Обновить несколько настроек одновременно
     */
    public List<SystemSettingsDto> updateSettings(List<SystemSettingsDto> settingsDtos) {
        List<SystemSettings> settings = settingsDtos.stream()
                .map(this::mapToEntity)
                .collect(Collectors.toList());
        
        settings = systemSettingsRepository.saveAll(settings);
        
        return settings.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Удалить настройку
     */
    public void deleteSetting(String key) {
        systemSettingsRepository.deleteById(key);
    }
    
    /**
     * Инициализация настроек по умолчанию, если они отсутствуют
     */
    public void initDefaultSettings() {
        // Настройки размеров файлов
        createIfNotExists("max_file_size", "10485760", "Максимальный размер файла для загрузки (в байтах)", "file_limits");
        createIfNotExists("min_file_size", "1024", "Минимальный размер файла для загрузки (в байтах)", "file_limits");
        
        // Настройки квот пользователей
        createIfNotExists("user_quota_reader", "10", "Максимальное количество изображений для пользователя с ролью READER", "user_quotas");
        createIfNotExists("user_quota_moderator", "50", "Максимальное количество изображений для пользователя с ролью MODERATOR", "user_quotas");
        createIfNotExists("user_quota_admin", "0", "Максимальное количество изображений для пользователя с ролью ADMIN (0 - без ограничений)", "user_quotas");
        
        // Настройки категорий изображений
        createIfNotExists("image_categories", "Личное,Работа,Природа,Архитектура,Другое", "Список доступных категорий изображений", "image_categories");
    }
    
    /**
     * Создать настройку, если она не существует
     */
    private void createIfNotExists(String key, String value, String description, String group) {
        if (!systemSettingsRepository.existsById(key)) {
            SystemSettings setting = new SystemSettings(key, value, description, group);
            systemSettingsRepository.save(setting);
        }
    }
    
    /**
     * Преобразовать Entity в DTO
     */
    private SystemSettingsDto mapToDto(SystemSettings settings) {
        return new SystemSettingsDto(
                settings.getSettingKey(),
                settings.getSettingValue(),
                settings.getDescription(),
                settings.getSettingGroup()
        );
    }
    
    /**
     * Преобразовать DTO в Entity
     */
    private SystemSettings mapToEntity(SystemSettingsDto dto) {
        return new SystemSettings(
                dto.getSettingKey(),
                dto.getSettingValue(),
                dto.getDescription(),
                dto.getSettingGroup()
        );
    }
}