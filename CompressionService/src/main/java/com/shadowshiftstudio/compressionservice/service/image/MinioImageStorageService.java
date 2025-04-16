package com.shadowshiftstudio.compressionservice.service.image;

import com.shadowshiftstudio.compressionservice.entity.ImageEntity;
import com.shadowshiftstudio.compressionservice.mapper.ImageMapper;
import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.repository.ImageRepository;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import com.shadowshiftstudio.compressionservice.service.webp.WebpService;
import com.shadowshiftstudio.compressionservice.util.webp.WebpOptions;
import io.minio.*;
import io.minio.messages.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Реализация сервиса хранения изображений, использующая MinIO напрямую.
 * Эта реализация отключена в пользу RemoteImageStorageService, которая следует 
 * микросервисной архитектуре и взаимодействует с ImageStorageService через API.
 */
@Service
@ConditionalOnProperty(name = "minio.direct.connection", havingValue = "true", matchIfMissing = false)
public class MinioImageStorageService implements ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(MinioImageStorageService.class);
    private static final String WEBP_CONTENT_TYPE = "image/webp";
    private static final String BACKUP_PREFIX = "backup_";

    private final MinioClient minioClient;
    private final ImageRepository imageRepository;
    private final ImageMapper imageMapper;
    private final WebpService webpService;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${minio.backup.bucket:image-backups}")
    private String backupBucketName;

    @Autowired
    public MinioImageStorageService(MinioClient minioClient, ImageRepository imageRepository,
                                    ImageMapper imageMapper, WebpService webpService) {
        this.minioClient = minioClient;
        this.imageRepository = imageRepository;
        this.imageMapper = imageMapper;
        this.webpService = webpService;
        
        logger.warn("Инициализирована прямая реализация MinioImageStorageService, " +
                    "что нарушает микросервисную архитектуру. Рекомендуется использовать RemoteImageStorageService.");
    }

    @PostConstruct
    public void init() {
        try {
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if (!bucketExists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
                logger.info("Created new bucket: {}", bucketName);
            }

            boolean backupBucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(backupBucketName).build()
            );

            if (!backupBucketExists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(backupBucketName).build()
                );
                logger.info("Created new backup bucket: {}", backupBucketName);
            }

            long count = imageRepository.count();
            if (count > 0) {
                logger.info("Database already contains {} image metadata records", count);
                return;
            }

            logger.info("Initializing image metadata from MinIO bucket: {}", bucketName);
            Iterable<Result<Item>> results = minioClient.listObjects(
                    ListObjectsArgs.builder().bucket(bucketName).build());

            Pattern idPattern = Pattern.compile("^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_.*");

            int restoredCount = 0;

            for (Result<Item> result : results) {
                try {
                    Item item = result.get();
                    String objectName = item.objectName();

                    Matcher matcher = idPattern.matcher(objectName);
                    if (!matcher.matches()) {
                        logger.warn("Object name does not match expected pattern: {}", objectName);
                        continue;
                    }

                    String imageId = matcher.group(1);

                    if (imageRepository.existsById(imageId)) {
                        logger.debug("Image metadata for id={} already exists in database", imageId);
                        continue;
                    }

                    StatObjectResponse stat = minioClient.statObject(
                            StatObjectArgs.builder()
                                    .bucket(bucketName)
                                    .object(objectName)
                                    .build()
                    );

                    String filename = objectName.substring(imageId.length() + 1).replace("_", " ");

                    ImageEntity entity = new ImageEntity();
                    entity.setId(imageId);
                    entity.setOriginalFilename(filename);
                    entity.setContentType(stat.contentType());
                    entity.setObjectName(objectName);
                    entity.setSize(stat.size());
                    entity.setCompressionLevel(0);
                    entity.setUploadedAt(LocalDateTime.now().minusDays(1));
                    entity.setLastAccessed(LocalDateTime.now().minusDays(1));
                    entity.setAccessCount(0);

                    if (objectName.contains("_compressed_")) {
                        Pattern compressedPattern = Pattern.compile(".*_compressed_(\\d+)_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_.*");
                        Matcher compressedMatcher = compressedPattern.matcher(objectName);

                        if (compressedMatcher.matches()) {
                            int compressionLevel = Integer.parseInt(compressedMatcher.group(1));
                            String originalId = compressedMatcher.group(2);

                            entity.setCompressionLevel(compressionLevel);
                            entity.setOriginalImageId(originalId);
                        }
                    }

                    imageRepository.save(entity);
                    restoredCount++;

                } catch (Exception e) {
                    logger.warn("Failed to restore metadata for an object", e);
                }
            }

            logger.info("Successfully restored metadata for {} images", restoredCount);

        } catch (Exception e) {
            logger.error("Failed to initialize image metadata", e);
        }
    }

    @Override
    @Transactional
    public Image storeImage(MultipartFile file) throws IOException {
        try {
            byte[] imageData = file.getBytes();

            if (!webpService.isSupportedFormat(imageData)) {
                throw new IOException("Unsupported image format: " + file.getContentType());
            }

            byte[] webpData = webpService.convertToWebp(imageData);
            if (webpData == null) {
                throw new IOException("Failed to convert image to WebP");
            }

            String originalFilename = getFileNameWithoutExtension(file.getOriginalFilename()) + ".webp";
            Image image = new Image(originalFilename, WEBP_CONTENT_TYPE, webpData.length);

            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(webpData)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(image.getObjectName())
                                .contentType(WEBP_CONTENT_TYPE)
                                .stream(inputStream, webpData.length, -1)
                                .build()
                );
                
                String backupObjectName = BACKUP_PREFIX + image.getObjectName();
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(backupBucketName)
                                .object(backupObjectName)
                                .contentType(WEBP_CONTENT_TYPE)
                                .stream(new ByteArrayInputStream(webpData), webpData.length, -1)
                                .build()
                );
            }

            ImageEntity entity = imageMapper.toEntity(image);
            imageRepository.save(entity);

            logger.info("Successfully stored WebP image: id={}, name={}, original format={}",
                    image.getId(), image.getOriginalFilename(), file.getContentType());
            return image;

        } catch (Exception e) {
            logger.error("Failed to store image as WebP", e);
            throw new IOException("Failed to store image as WebP: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Image storeCompressedImage(String imageId, byte[] compressedData, int compressionLevel) throws IOException {
        return updateImageCompression(imageId, compressedData, compressionLevel);
    }

    @Override
    @Transactional
    public Image updateImageCompression(String imageId, byte[] imageData, int compressionLevel) throws IOException {
        Image image = getImageMetadata(imageId);
        if (image == null) {
            logger.warn("Image not found: id={}", imageId);
            throw new IOException("Image not found with id: " + imageId);
        }

        try {
            if (image.getCompressionLevel() == 0 && compressionLevel > 0) {
                byte[] originalData = getImage(imageId);
                
                String backupObjectName = BACKUP_PREFIX + image.getObjectName();
                boolean backupExists = false;
                
                try {
                    minioClient.statObject(
                            StatObjectArgs.builder()
                                    .bucket(backupBucketName)
                                    .object(backupObjectName)
                                    .build()
                    );
                    backupExists = true;
                } catch (Exception e) {
                }
                
                if (!backupExists) {
                    try (ByteArrayInputStream inputStream = new ByteArrayInputStream(originalData)) {
                        minioClient.putObject(
                                PutObjectArgs.builder()
                                        .bucket(backupBucketName)
                                        .object(backupObjectName)
                                        .contentType(WEBP_CONTENT_TYPE)
                                        .stream(inputStream, originalData.length, -1)
                                        .build()
                        );
                        logger.info("Created backup of original image: id={}", imageId);
                    }
                }
            }

            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(image.getObjectName())
                                .contentType(WEBP_CONTENT_TYPE)
                                .stream(inputStream, imageData.length, -1)
                                .build()
                );
            }

            ImageEntity entity = imageRepository.findById(imageId).orElse(null);
            if (entity == null) {
                throw new IOException("Image entity not found in database: " + imageId);
            }
            
            entity.setSize(imageData.length);
            entity.setCompressionLevel(compressionLevel);
            entity.setLastAccessed(LocalDateTime.now());
            
            imageRepository.save(entity);

            logger.info("Successfully updated image compression: id={}, compressionLevel={}, size={}",
                    imageId, compressionLevel, imageData.length);
            
            return imageMapper.toModel(entity);

        } catch (Exception e) {
            logger.error("Failed to update image compression: id={}", imageId, e);
            throw new IOException("Failed to update image compression: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] getOriginalImageBackup(String id) throws IOException {
        Image image = getImageMetadata(id);
        if (image == null) {
            logger.warn("Image not found: id={}", id);
            return null;
        }

        if (image.getCompressionLevel() == 0) {
            return getImage(id);
        }

        String backupObjectName = BACKUP_PREFIX + image.getObjectName();

        try {
            GetObjectResponse response = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(backupBucketName)
                            .object(backupObjectName)
                            .build()
            );

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = response.read(buffer, 0, buffer.length)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            logger.info("Retrieved original image backup: id={}", id);
            return outputStream.toByteArray();

        } catch (Exception e) {
            logger.error("Failed to get original image backup: id={}", id, e);
            return null;
        }
    }

    @Override
    @Transactional
    public byte[] getImage(String id) throws IOException {
        Image image = getImageMetadata(id);
        if (image == null) {
            logger.warn("Image not found: id={}", id);
            return null;
        }

        try {
            ImageEntity entity = imageRepository.findById(id).orElse(null);
            if (entity != null) {
                entity.incrementAccessCount();
                imageRepository.save(entity);
            }

            GetObjectResponse response = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(image.getObjectName())
                            .build()
            );

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = response.read(buffer, 0, buffer.length)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            logger.info("Retrieved image: id={}, name={}, accessCount={}",
                    image.getId(), image.getOriginalFilename(), image.getAccessCount() + 1);
            return outputStream.toByteArray();

        } catch (Exception e) {
            logger.error("Failed to get image: id={}", id, e);
            throw new IOException("Failed to get image: " + e.getMessage(), e);
        }
    }

    @Override
    public Image getImageMetadata(String id) {
        ImageEntity entity = imageRepository.findById(id).orElse(null);
        return imageMapper.toModel(entity);
    }

    @Override
    public Map<String, Image> getAllImageMetadata() {
        List<ImageEntity> entities = imageRepository.findAll();
        return entities.stream()
                .map(imageMapper::toModel)
                .collect(Collectors.toMap(Image::getId, image -> image));
    }

    @Override
    @Transactional
    public boolean deleteImage(String id) throws IOException {
        ImageEntity entity = imageRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Cannot delete image, not found: id={}", id);
            return false;
        }

        Image image = imageMapper.toModel(entity);

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(image.getObjectName())
                            .build()
            );

            try {
                String backupObjectName = BACKUP_PREFIX + image.getObjectName();
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(backupBucketName)
                                .object(backupObjectName)
                                .build()
                );
                logger.info("Deleted backup for image: id={}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete backup for image id={}, it might not exist", id);
            }

            imageRepository.deleteById(id);

            logger.info("Successfully deleted image: id={}, name={}", id, image.getOriginalFilename());
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete image: id={}", id, e);
            throw new IOException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    private String getFileNameWithoutExtension(String filename) {
        if (filename == null) {
            return "image";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(0, lastDot);
        }
        return filename;
    }

    private int mapCompressionLevelToQuality(int compressionLevel) {
        return Math.max(0, Math.min(100, 100 - compressionLevel));
    }
}