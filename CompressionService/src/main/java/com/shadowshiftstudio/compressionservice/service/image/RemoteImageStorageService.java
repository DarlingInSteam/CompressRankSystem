package com.shadowshiftstudio.compressionservice.service.image;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import com.shadowshiftstudio.compressionservice.service.client.ImageStorageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Реализация ImageStorageService, которая делегирует запросы к ImageStorageClient.
 * Эта реализация следует правильной архитектуре микросервисов, где CompressionService
 * не обращается напрямую к MinIO, а делает запросы через ImageStorageService.
 */
@Service
@Primary // Помечаем как основную реализацию, которая будет использована при автоподключении
public class RemoteImageStorageService implements ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(RemoteImageStorageService.class);
    private final ImageStorageClient imageStorageClient;

    @Autowired
    public RemoteImageStorageService(ImageStorageClient imageStorageClient) {
        this.imageStorageClient = imageStorageClient;
        logger.info("Инициализирована реализация RemoteImageStorageService");
    }

    @Override
    public Image storeImage(MultipartFile file) throws IOException {
        return imageStorageClient.storeImage(file);
    }

    @Override
    public Image storeCompressedImage(String imageId, byte[] compressedData, int compressionLevel) throws IOException {
        return imageStorageClient.updateImageCompression(imageId, compressedData, compressionLevel);
    }

    @Override
    public Image updateImageCompression(String imageId, byte[] imageData, int compressionLevel) throws IOException {
        return imageStorageClient.updateImageCompression(imageId, imageData, compressionLevel);
    }

    @Override
    public byte[] getOriginalImageBackup(String id) throws IOException {
        return imageStorageClient.getOriginalImageBackup(id);
    }

    @Override
    public byte[] getImage(String id) throws IOException {
        return imageStorageClient.getImage(id);
    }

    @Override
    public Image getImageMetadata(String id) {
        return imageStorageClient.getImageMetadata(id);
    }

    @Override
    public Map<String, Image> getAllImageMetadata() {
        throw new UnsupportedOperationException("Получение всех метаданных через брокер сообщений не реализовано");
    }

    @Override
    public boolean deleteImage(String id) throws IOException {
        return imageStorageClient.deleteImage(id);
    }
}