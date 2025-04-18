package shadowshift.studio.imagestorage.exception;

/**
 * Исключение, выбрасываемое при превышении лимитов размера файла
 */
public class FileSizeLimitException extends RuntimeException {
    
    public FileSizeLimitException(String message) {
        super(message);
    }
    
    public FileSizeLimitException(String message, Throwable cause) {
        super(message, cause);
    }
}