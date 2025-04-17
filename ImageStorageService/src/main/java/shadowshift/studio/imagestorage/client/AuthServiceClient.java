package shadowshift.studio.imagestorage.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Клиент для взаимодействия с сервисом аутентификации и получения системных настроек
 */
@Component
public class AuthServiceClient {
    private static final Logger logger = LoggerFactory.getLogger(AuthServiceClient.class);
    
    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthServiceClient(RestTemplate restTemplate, 
                           @Value("${auth.service.url:http://localhost:8082}") String authServiceUrl) {
        this.restTemplate = restTemplate;
        this.authServiceUrl = authServiceUrl;
        logger.info("AuthServiceClient initialized with URL: {}", authServiceUrl);
    }
    
    /**
     * Получить настройки лимитов файлов
     */
    public Map<String, String> getFileLimits() {
        try {
            String url = authServiceUrl + "/api/auth/system/settings/public/file-limits";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return new HashMap<>();
        } catch (Exception e) {
            logger.error("Failed to get file limits from auth service", e);
            return Collections.emptyMap();
        }
    }
    
    /**
     * Получить настройки квот пользователей
     */
    public Map<String, String> getUserQuotas() {
        try {
            String url = authServiceUrl + "/api/auth/system/settings/group/user_quotas";
            ResponseEntity<Map[]> response = restTemplate.getForEntity(url, Map[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, String> result = new HashMap<>();
                for (Map<String, Object> setting : response.getBody()) {
                    String key = (String) setting.get("settingKey");
                    String value = (String) setting.get("settingValue");
                    if (key != null && value != null) {
                        result.put(key, value);
                    }
                }
                return result;
            }
            return new HashMap<>();
        } catch (Exception e) {
            logger.error("Failed to get user quotas from auth service", e);
            return Collections.emptyMap();
        }
    }
    
    /**
     * Получить категории изображений
     */
    public String[] getImageCategories() {
        try {
            String url = authServiceUrl + "/api/auth/system/settings/public/image-categories";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String[]) response.getBody().get("categories");
            }
            return new String[0];
        } catch (Exception e) {
            logger.error("Failed to get image categories from auth service", e);
            return new String[0];
        }
    }
    
    /**
     * Получить информацию о пользователе
     */
    public Map<String, Object> getUserInfo(String token) {
        try {
            String url = authServiceUrl + "/api/auth/user/info";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Failed to get user info from auth service", e);
            return Collections.emptyMap();
        }
    }
}