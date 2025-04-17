package shadowshift.studio.authservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shadowshift.studio.authservice.model.SystemSettings;

import java.util.List;

/**
 * Репозиторий для доступа к системным настройкам
 */
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, String> {
    
    /**
     * Поиск настроек по группе
     */
    List<SystemSettings> findBySettingGroup(String settingGroup);
}