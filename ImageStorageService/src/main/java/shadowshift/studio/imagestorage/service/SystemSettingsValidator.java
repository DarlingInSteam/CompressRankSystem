package shadowshift.studio.imagestorage.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import shadowshift.studio.imagestorage.client.AuthServiceClient;
import shadowshift.studio.imagestorage.exception.FileSizeLimitException;
import shadowshift.studio.imagestorage.exception.UserQuotaExceededException;
import shadowshift.studio.imagestorage.model.Image;

import java.util.Map;

/**
 * Сервис для проверки системных настроек
 */
@Service
public class SystemSettingsValidator {
    private static final Logger logger = LoggerFactory.getLogger(SystemSettingsValidator.class);
    
    private final AuthServiceClient authServiceClient;
    
    @Autowired
    public SystemSettingsValidator(AuthServiceClient authServiceClient) {
        this.authServiceClient = authServiceClient;
    }
    
    /**
     * Проверка размера файла согласно системным настройкам
     */
    public void validateFileSize(MultipartFile file) {
        try {
            Map<String, String> fileLimits = authServiceClient.getFileLimits();
            
            long maxFileSize = Long.parseLong(
                    fileLimits.getOrDefault("max_file_size", "10485760")); // По умолчанию 10MB
            long minFileSize = Long.parseLong(
                    fileLimits.getOrDefault("min_file_size", "1024")); // По умолчанию 1KB
            
            long fileSize = file.getSize();
            
            if (fileSize > maxFileSize) {
                throw new FileSizeLimitException("Размер файла превышает максимально допустимый: " + 
                        formatFileSize(fileSize) + " > " + formatFileSize(maxFileSize));
            }
            
            if (fileSize < minFileSize) {
                throw new FileSizeLimitException("Размер файла меньше минимально допустимого: " + 
                        formatFileSize(fileSize) + " < " + formatFileSize(minFileSize));
            }
            
        } catch (NumberFormatException e) {
            logger.error("Ошибка парсинга числовых лимитов файлов", e);
        } catch (Exception e) {
            if (!(e instanceof FileSizeLimitException)) {
                logger.error("Ошибка при получении лимитов файлов", e);
            } else {
                throw e;
            }
        }
    }
    
    /**
     * Проверка квоты пользователя на количество изображений
     */
    public void validateUserQuota(String username, String userRole, long currentImageCount) {
        try {
            Map<String, String> quotas = authServiceClient.getUserQuotas();
            
            String quotaKey = "user_quota_" + userRole.toLowerCase();
            String quotaValue = quotas.getOrDefault(quotaKey, "0");
            
            int maxImages = Integer.parseInt(quotaValue);
            
            // Если квота равна 0, то ограничений нет
            if (maxImages > 0 && currentImageCount >= maxImages) {
                throw new UserQuotaExceededException(
                        "Превышена квота пользователя " + username + 
                        " (" + userRole + "): " + currentImageCount + "/" + maxImages);
            }
            
        } catch (NumberFormatException e) {
            logger.error("Ошибка парсинга числовых значений квот", e);
        } catch (Exception e) {
            if (!(e instanceof UserQuotaExceededException)) {
                logger.error("Ошибка при получении квот пользователей", e);
            } else {
                throw e;
            }
        }
    }
    
    /**
     * Форматирование размера файла для удобного отображения
     */
    private String formatFileSize(long size) {
        if (size < 1024) {
            return size + " байт";
        } else if (size < 1024 * 1024) {
            return String.format("%.2f КБ", size / 1024.0);
        } else {
            return String.format("%.2f МБ", size / (1024.0 * 1024.0));
        }
    }
}