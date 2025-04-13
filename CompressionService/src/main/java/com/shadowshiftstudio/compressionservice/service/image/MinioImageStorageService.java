package com.shadowshiftstudio.compressionservice.service.image;

import com.shadowshiftstudio.compressionservice.entity.ImageEntity;
import com.shadowshiftstudio.compressionservice.mapper.ImageMapper;
import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.repository.ImageRepository;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import io.minio.*;
import io.minio.messages.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MinioImageStorageService implements ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(MinioImageStorageService.class);

    private final MinioClient minioClient;
    private final ImageRepository imageRepository;
    private final ImageMapper imageMapper;
    
    @Value("${minio.bucket}")
    private String bucketName;

    @Autowired
    public MinioImageStorageService(MinioClient minioClient, ImageRepository imageRepository, ImageMapper imageMapper) {
        this.minioClient = minioClient;
        this.imageRepository = imageRepository;
        this.imageMapper = imageMapper;
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
                return;
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
            Image image = new Image(file.getOriginalFilename(), file.getContentType(), file.getSize());
            
            // Загружаем файл в MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(image.getObjectName())
                            .contentType(file.getContentType())
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .build()
            );
            
            ImageEntity entity = imageMapper.toEntity(image);
            imageRepository.save(entity);
            
            logger.info("Successfully stored image: id={}, name={}", image.getId(), image.getOriginalFilename());
            return image;
            
        } catch (Exception e) {
            logger.error("Failed to store image", e);
            throw new IOException("Failed to store image: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Image storeCompressedImage(String imageId, byte[] compressedData, int compressionLevel) throws IOException {
        Image originalImage = getImageMetadata(imageId);
        if (originalImage == null) {
            logger.warn("Original image not found: id={}", imageId);
            throw new IOException("Original image not found with id: " + imageId);
        }
        
        try {
            Image compressedImage = new Image(
                    originalImage.getOriginalFilename(),
                    originalImage.getContentType(),
                    compressedData.length
            );
            compressedImage.setCompressionLevel(compressionLevel);
            compressedImage.setOriginalImageId(imageId);
            
            String objectName = compressedImage.getId() + "_compressed_" + compressionLevel + "_" + imageId + "_" +
                    originalImage.getOriginalFilename().replaceAll("\\s+", "_");
            compressedImage.setObjectName(objectName);
            
            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(compressedData)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(compressedImage.getObjectName())
                                .contentType(originalImage.getContentType())
                                .stream(inputStream, compressedData.length, -1)
                                .build()
                );
            }
            
            ImageEntity entity = imageMapper.toEntity(compressedImage);
            imageRepository.save(entity);
            
            logger.info("Successfully stored compressed image: id={}, originalId={}, compressionLevel={}, size={}",
                    compressedImage.getId(), imageId, compressionLevel, compressedData.length);
            return compressedImage;
            
        } catch (Exception e) {
            logger.error("Failed to store compressed image for original id={}", imageId, e);
            throw new IOException("Failed to store compressed image: " + e.getMessage(), e);
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
            
            imageRepository.deleteById(id);
            
            logger.info("Successfully deleted image: id={}, name={}", id, image.getOriginalFilename());
            
            if (image.getOriginalImageId() == null) {
                List<ImageEntity> compressedVersions = imageRepository.findByOriginalImageId(id);
                
                for (ImageEntity compressedVersion : compressedVersions) {
                    try {
                        deleteImage(compressedVersion.getId());
                    } catch (Exception e) {
                        logger.error("Failed to delete compressed version: id={}", compressedVersion.getId(), e);
                    }
                }
            }
            
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete image: id={}", id, e);
            throw new IOException("Failed to delete image: " + e.getMessage(), e);
        }
    }
}