package shadowshift.studio.authservice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO для передачи данных настроек системы
 */
public class SystemSettingsDto {
    
    @NotBlank(message = "Ключ настройки не может быть пустым")
    private String settingKey;
    
    private String settingValue;
    
    private String description;
    
    private String settingGroup;
    
    // Конструкторы
    public SystemSettingsDto() {
    }
    
    public SystemSettingsDto(String settingKey, String settingValue, String description, String settingGroup) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.description = description;
        this.settingGroup = settingGroup;
    }
    
    // Геттеры и сеттеры
    public String getSettingKey() {
        return settingKey;
    }
    
    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }
    
    public String getSettingValue() {
        return settingValue;
    }
    
    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getSettingGroup() {
        return settingGroup;
    }
    
    public void setSettingGroup(String settingGroup) {
        this.settingGroup = settingGroup;
    }
}