package com.shadowshiftstudio.compressionservice.service;

import com.shadowshiftstudio.compressionservice.model.Image;
import org.imgscalr.Scalr;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;

@Service
public class CompressionService {

    private final ImageStorageService imageStorageService;

    @Autowired
    public CompressionService(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    /**
     * Сжимает изображение на основе уровня сжатия
     * @param imageId ID изображения
     * @param compressionLevel уровень сжатия (0-10, где 0 - без сжатия, 10 - максимальное сжатие)
     * @return обновленные метаданные изображения
     */
    public Image compressImage(String imageId, int compressionLevel) throws Exception {
        if (compressionLevel < 0 || compressionLevel > 10) {
            throw new IllegalArgumentException("Compression level must be between 0 and 10");
        }
        
        if (compressionLevel == 0) {
            return imageStorageService.getImageMetadata(imageId);
        }
        
        byte[] imageData = imageStorageService.getImage(imageId);
        Image imageMetadata = imageStorageService.getImageMetadata(imageId);
        
        String format = getFormatFromContentType(imageMetadata.getContentType());
        
        BufferedImage originalImage;
        try (InputStream is = new ByteArrayInputStream(imageData)) {
            originalImage = ImageIO.read(is);
        }
        
        if (originalImage == null) {
            throw new IOException("Could not read image");
        }
        
        byte[] compressedData;
        if ("jpg".equalsIgnoreCase(format) || "jpeg".equalsIgnoreCase(format)) {
            compressedData = compressJpeg(originalImage, compressionLevel);
        } else if ("png".equalsIgnoreCase(format)) {
            compressedData = compressPng(originalImage, compressionLevel, format);
        } else {
            compressedData = compressGeneric(originalImage, compressionLevel, format);
        }
        
        return imageStorageService.storeCompressedImage(imageId, compressedData, compressionLevel);
    }
    
    private byte[] compressJpeg(BufferedImage image, int compressionLevel) throws IOException {
        float quality = 1.0f - (compressionLevel / 10.0f);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        ImageWriter writer = writers.next();
        
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);
        
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputStream)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        
        return outputStream.toByteArray();
    }
    
    private byte[] compressPng(BufferedImage image, int compressionLevel, String format) throws IOException {
        double scaleFactor = 1.0 - (compressionLevel * 0.05);
        
        int newWidth = (int) (image.getWidth() * scaleFactor);
        int newHeight = (int) (image.getHeight() * scaleFactor);
        
        BufferedImage resized = Scalr.resize(image, Scalr.Method.QUALITY, newWidth, newHeight);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resized, format, outputStream);
        
        return outputStream.toByteArray();
    }
    
    private byte[] compressGeneric(BufferedImage image, int compressionLevel, String format) throws IOException {
        double scaleFactor = 1.0 - (compressionLevel * 0.07);
        
        int newWidth = (int) (image.getWidth() * scaleFactor);
        int newHeight = (int) (image.getHeight() * scaleFactor);
        
        BufferedImage resized = Scalr.resize(image, Scalr.Method.BALANCED, newWidth, newHeight);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resized, format, outputStream);
        
        return outputStream.toByteArray();
    }
    
    /**
     * Извлекает формат изображения из Content-Type
     */
    private String getFormatFromContentType(String contentType) {
        if (contentType == null) {
            return "png";
        }
        
        String[] parts = contentType.split("/");
        if (parts.length == 2) {
            return parts[1];
        }
        
        return "png";
    }
}