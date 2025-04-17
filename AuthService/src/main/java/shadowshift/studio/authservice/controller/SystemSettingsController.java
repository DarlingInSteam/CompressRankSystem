package shadowshift.studio.authservice.controller;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import shadowshift.studio.authservice.dto.SystemSettingsDto;
import shadowshift.studio.authservice.service.SystemSettingsService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Контроллер для управления системными настройками
 */
@RestController
@RequestMapping("/api/auth/system/settings")
public class SystemSettingsController {

    private final SystemSettingsService settingsService;

    @Autowired
    public SystemSettingsController(SystemSettingsService settingsService) {
        this.settingsService = settingsService;
    }
    
    /**
     * Инициализация настроек по умолчанию при запуске
     */
    @PostConstruct
    public void init() {
        settingsService.initDefaultSettings();
    }

    /**
     * Получить все настройки системы (только для администратора)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemSettingsDto>> getAllSettings() {
        List<SystemSettingsDto> settings = settingsService.getAllSettings();
        return ResponseEntity.ok(settings);
    }

    /**
     * Получить настройки по группе (только для администратора)
     */
    @GetMapping("/group/{group}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemSettingsDto>> getSettingsByGroup(@PathVariable String group) {
        List<SystemSettingsDto> settings = settingsService.getSettingsByGroup(group);
        return ResponseEntity.ok(settings);
    }

    /**
     * Получить настройку по ключу (только для администратора)
     */
    @GetMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSettingsDto> getSettingByKey(@PathVariable String key) {
        SystemSettingsDto setting = settingsService.getSettingByKey(key);
        if (setting == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(setting);
    }

    /**
     * Создать или обновить настройку (только для администратора)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSettingsDto> createOrUpdateSetting(@Valid @RequestBody SystemSettingsDto settingDto) {
        SystemSettingsDto savedSetting = settingsService.createOrUpdateSetting(settingDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSetting);
    }

    /**
     * Обновить несколько настроек одновременно (только для администратора)
     */
    @PutMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemSettingsDto>> updateSettings(@Valid @RequestBody List<SystemSettingsDto> settingDtos) {
        List<SystemSettingsDto> savedSettings = settingsService.updateSettings(settingDtos);
        return ResponseEntity.ok(savedSettings);
    }

    /**
     * Удалить настройку по ключу (только для администратора)
     */
    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteSetting(@PathVariable String key) {
        settingsService.deleteSetting(key);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Настройка успешно удалена");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Получить настройки лимитов файлов (для публичного доступа)
     */
    @GetMapping("/public/file-limits")
    public ResponseEntity<Map<String, String>> getPublicFileLimits() {
        List<SystemSettingsDto> fileLimits = settingsService.getSettingsByGroup("file_limits");
        Map<String, String> limitsMap = new HashMap<>();
        
        for (SystemSettingsDto setting : fileLimits) {
            limitsMap.put(setting.getSettingKey(), setting.getSettingValue());
        }
        
        return ResponseEntity.ok(limitsMap);
    }
    
    /**
     * Получить доступные категории изображений (для публичного доступа)
     */
    @GetMapping("/public/image-categories")
    public ResponseEntity<Map<String, Object>> getPublicImageCategories() {
        SystemSettingsDto categoriesSetting = settingsService.getSettingByKey("image_categories");
        Map<String, Object> response = new HashMap<>();
        
        if (categoriesSetting != null) {
            String[] categories = categoriesSetting.getSettingValue().split(",");
            response.put("categories", categories);
        } else {
            response.put("categories", new String[0]);
        }
        
        return ResponseEntity.ok(response);
    }
}
