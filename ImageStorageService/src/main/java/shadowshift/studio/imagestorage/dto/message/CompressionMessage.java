package shadowshift.studio.imagestorage.dto.message;

/**
 * Расширенное сообщение, содержащее бинарные данные изображения
 * и уровень сжатия для компрессии
 */
public class CompressionMessage extends ImageMessage {
    
    private byte[] imageData;
    private int compressionLevel;
    
    public CompressionMessage() {
        super();
    }
    
    public byte[] getImageData() {
        return imageData;
    }
    
    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }
    
    public int getCompressionLevel() {
        return compressionLevel;
    }
    
    public void setCompressionLevel(int compressionLevel) {
        this.compressionLevel = compressionLevel;
    }
}