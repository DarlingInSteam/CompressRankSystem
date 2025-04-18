package shadowshift.studio.authservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Модель настроек системы
 */
@Entity
@Table(name = "system_settings")
public class SystemSettings {
    
    @Id
    private String settingKey;
    
    private String settingValue;
    
    private String description;
    
    private String settingGroup;
    
    // Конструкторы
    public SystemSettings() {
    }
    
    public SystemSettings(String settingKey, String settingValue, String description, String settingGroup) {
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