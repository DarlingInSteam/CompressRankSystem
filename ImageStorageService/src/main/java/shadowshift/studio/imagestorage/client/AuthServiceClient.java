package shadowshift.studio.imagestorage.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
            // Используем новый публичный эндпоинт вместо защищенного
            String url = authServiceUrl + "/api/auth/system/settings/public/user-quotas";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
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
     * Получить информацию о пользователе по токену
     */
    public Map<String, Object> getUserInfo(String token) {
        try {
            if (token == null || token.isEmpty()) {
                logger.warn("No token provided to getUserInfo");
                return Collections.emptyMap();
            }
            
            // Сначала пробуем получить данные по токену
            String url = authServiceUrl + "/api/auth/user/info";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response;
            try {
                response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return response.getBody();
                }
            } catch (Exception e) {
                logger.warn("Failed to get user info with token, will try with username extraction");
                
                // Если не удалось получить данные по токену, попробуем извлечь имя пользователя из токена
                String username = extractUsernameFromToken(token);
                if (username != null && !username.isEmpty()) {
                    return getUserInfoByUsername(username);
                }
            }
            
            return Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Failed to get user info from auth service", e);
            return Collections.emptyMap();
        }
    }
    
    /**
     * Получить информацию о пользователе по имени пользователя
     */
    public Map<String, Object> getUserInfoByUsername(String username) {
        try {
            if (username == null || username.isEmpty()) {
                logger.warn("No username provided to getUserInfoByUsername");
                return Collections.emptyMap();
            }
            
            // Используем публичный эндпоинт для получения информации о пользователе по имени
            String url = authServiceUrl + "/api/auth/user/info/public?username=" + username;
            logger.info("Getting user info for username: {}", username);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Collections.emptyMap();
        } catch (Exception e) {
            logger.error("Failed to get user info by username from auth service", e);
            return Collections.emptyMap();
        }
    }
    
    /**
     * Извлечение имени пользователя из JWT токена
     */
    private String extractUsernameFromToken(String token) {
        try {
            // Простое извлечение имени пользователя из JWT токена без проверки подписи
            // Для production следует использовать библиотеку JWT
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            
            // Декодируем payload (вторая часть токена)
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            
            // Так как payload - это JSON, извлекаем имя пользователя
            if (payload.contains("\"username\"")) {
                int startIndex = payload.indexOf("\"username\"") + 11;
                int endIndex = payload.indexOf("\"", startIndex + 1);
                if (startIndex >= 0 && endIndex >= 0) {
                    String username = payload.substring(startIndex + 1, endIndex);
                    logger.info("Extracted username from token: {}", username);
                    return username;
                }
            } else if (payload.contains("\"sub\"")) {
                // Некоторые токены используют "sub" вместо "username"
                int startIndex = payload.indexOf("\"sub\"") + 6;
                int endIndex = payload.indexOf("\"", startIndex + 1);
                if (startIndex >= 0 && endIndex >= 0) {
                    String username = payload.substring(startIndex + 1, endIndex);
                    logger.info("Extracted username from token sub: {}", username);
                    return username;
                }
            }
            
            return null;
        } catch (Exception e) {
            logger.error("Error extracting username from token", e);
            return null;
        }
    }
}