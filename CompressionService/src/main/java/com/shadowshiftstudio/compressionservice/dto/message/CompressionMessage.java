package com.shadowshiftstudio.compressionservice.dto.message;

public class CompressionMessage extends ImageMessage {
    private int compressionLevel;
    private byte[] imageData; // Base64 encoded if sent via JSON
    
    public CompressionMessage() {
        super();
    }
    
    public int getCompressionLevel() {
        return compressionLevel;
    }
    
    public void setCompressionLevel(int compressionLevel) {
        this.compressionLevel = compressionLevel;
    }
    
    public byte[] getImageData() {
        return imageData;
    }
    
    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }
}