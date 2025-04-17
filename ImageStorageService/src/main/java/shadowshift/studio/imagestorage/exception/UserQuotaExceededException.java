package shadowshift.studio.imagestorage.exception;

/**
 * Исключение, выбрасываемое при превышении квоты пользователя на количество изображений
 */
public class UserQuotaExceededException extends RuntimeException {
    
    public UserQuotaExceededException(String message) {
        super(message);
    }
    
    public UserQuotaExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}