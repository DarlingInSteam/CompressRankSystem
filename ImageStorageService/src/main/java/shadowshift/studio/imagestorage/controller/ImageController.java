package shadowshift.studio.imagestorage.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import shadowshift.studio.imagestorage.exception.FileSizeLimitException;
import shadowshift.studio.imagestorage.exception.UserQuotaExceededException;
import shadowshift.studio.imagestorage.messaging.StatisticsEventSender;
import shadowshift.studio.imagestorage.model.Image;
import shadowshift.studio.imagestorage.model.UserInfo;
import shadowshift.studio.imagestorage.service.ImageStorageService;
import shadowshift.studio.imagestorage.client.AuthServiceClient;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/images")
@Tag(name = "Image Storage", description = "API для управления изображениями в хранилище")
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final StatisticsEventSender statisticsEventSender;
    private final AuthServiceClient authServiceClient;
    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);

    @Autowired
    public ImageController(ImageStorageService imageStorageService, StatisticsEventSender statisticsEventSender, 
                          AuthServiceClient authServiceClient) {
        this.imageStorageService = imageStorageService;
        this.statisticsEventSender = statisticsEventSender;
        this.authServiceClient = authServiceClient;
    }

    /**
     * Извлечение токена авторизации из заголовка
     */
    private String extractToken(HttpHeaders headers) {
        if (headers != null && headers.getFirst("Authorization") != null) {
            String authHeader = headers.getFirst("Authorization");
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        }
        return null;
    }

    @Operation(summary = "Загрузить изображение", description = "Загружает новое изображение в хранилище")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Изображение успешно загружено",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))),
            @ApiResponse(responseCode = "400", description = "Некорректный запрос - превышены лимиты по размеру файла или квоте пользователя"),
            @ApiResponse(responseCode = "500", description = "Внутренняя ошибка сервера")
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @Parameter(description = "Файл изображения для загрузки", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Name", required = false) String username,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader HttpHeaders headers) {
        try {
            // Извлекаем токен авторизации
            String token = extractToken(headers);
            
            // Создаем объект UserInfo из заголовков запроса
            UserInfo userInfo = null;
            
            // Если передан токен, пытаемся получить информацию о пользователе из Auth Service
            if (token != null && !token.isEmpty()) {
                Map<String, Object> userInfoFromAuth = authServiceClient.getUserInfo(token);
                if (!userInfoFromAuth.isEmpty()) {
                    // Если успешно получили информацию из Auth Service, используем её
                    String authUserId = userInfoFromAuth.get("id") != null ? userInfoFromAuth.get("id").toString() : null;
                    String authUsername = userInfoFromAuth.get("username") != null ? userInfoFromAuth.get("username").toString() : null;
                    String authUserRole = userInfoFromAuth.get("role") != null ? userInfoFromAuth.get("role").toString() : null;
                    
                    userInfo = new UserInfo(authUsername, authUserRole, authUserId);
                    logger.info("User info from Auth Service: user={}, role={}, id={}", 
                               authUsername, authUserRole, authUserId);
                }
            }
            
            // Если не удалось получить информацию из Auth Service, используем заголовки
            if (userInfo == null && username != null && userRole != null) {
                userInfo = new UserInfo(username, userRole, userId);
                logger.info("User {} (id={}) with role {} is uploading a file: {} ({})", 
                           userInfo.getUsername(), userInfo.getUserId(), userInfo.getRole(), file.getOriginalFilename(), file.getSize());
            } else if (userInfo == null) {
                logger.info("Anonymous upload of file: {} ({})", file.getOriginalFilename(), file.getSize());
            }
            
            Image image = imageStorageService.storeImage(file, userInfo.getUsername(), userInfo.getRole(), userInfo.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(image);
        } catch (FileSizeLimitException e) {
            logger.warn("File size limit exceeded: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Ограничение размера файла: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (UserQuotaExceededException e) {
            logger.warn("User quota exceeded: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Превышена пользовательская квота: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            logger.error("Error uploading image", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Внутренняя ошибка сервера: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @Operation(summary = "Get image by ID", description = "Returns the image file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image returned successfully",
                    content = @Content(mediaType = "image/*")),
            @ApiResponse(responseCode = "404", description = "Image not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Whether to download the image")
            @RequestParam(required = false, defaultValue = "false") boolean download) {
        try {
            byte[] imageData = imageStorageService.getImage(id);
            if (imageData == null) {
                return ResponseEntity.notFound().build();
            }

            Image metadata = imageStorageService.getImageMetadata(id);
            if (metadata == null) {
                return ResponseEntity.notFound().build();
            }

            // Send statistics event for view
            statisticsEventSender.sendViewEvent(id);
            logger.debug("Sent view event for image: {}", id);

            // If downloading, send statistics event for download
            if (download) {
                statisticsEventSender.sendDownloadEvent(id);
                logger.debug("Sent download event for image: {}", id);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(metadata.getContentType()));
            
            if (download) {
                headers.setContentDispositionFormData("attachment", metadata.getOriginalFilename());
            }

            return ResponseEntity.ok().headers(headers).body(imageData);
        } catch (IOException e) {
            logger.error("Error retrieving image: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Get image metadata", description = "Returns metadata about the image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metadata returned successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))),
            @ApiResponse(responseCode = "404", description = "Image not found")
    })
    @GetMapping("/{id}/metadata")
    public ResponseEntity<Image> getImageMetadata(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id) {
        Image image = imageStorageService.getImageMetadata(id);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(image);
    }

    @Operation(summary = "Get all images", description = "Returns metadata for all images")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metadata returned successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<?> getAllImages() {
        try {
            long startTime = System.currentTimeMillis();
            
            Map<String, Image> images = imageStorageService.getAllImageMetadata();
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("GET /api/images returned {} images in {}ms", images.size(), duration);
            
            // Return empty map instead of error message if no images found
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            logger.error("Error retrieving all images: {}", e.getMessage(), e);
            // Return empty map instead of error message to prevent client issues
            return ResponseEntity.ok(new HashMap<>());
        }
    }

    @Operation(summary = "Delete image", description = "Deletes an image from storage")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Image deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Image not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id) {
        try {
            boolean deleted = imageStorageService.deleteImage(id);
            if (!deleted) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Get user quota information", description = "Returns quota usage and limits for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quota information returned successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/quota")
    public ResponseEntity<?> getUserQuotaInfo(
            @RequestHeader(value = "X-User-Name", required = false) String username,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader HttpHeaders headers) {
        
        try {
            Map<String, Object> quotaInfo = new HashMap<>();
            
            // Extract authorization token
            String token = extractToken(headers);
            
            // Default values
            long maxImagesQuota = 100;
            long usedImagesCount = 0;
            long diskSpaceUsed = 0;
            long maxDiskSpace = 1024 * 1024 * 1024; // 1GB by default
            
            // Count user's images
            Map<String, Image> allImages = imageStorageService.getAllImageMetadata();
            long totalSize = 0;
            long userImagesCount = 0;
            
            // Попытаемся получить информацию о пользователе
            Map<String, Object> userInfoFromAuth = Collections.emptyMap();
            
            // Сначала пробуем через токен
            if (token != null && !token.isEmpty()) {
                userInfoFromAuth = authServiceClient.getUserInfo(token);
            }
            
            // Если не получилось через токен, но у нас есть username, пробуем через имя пользователя
            if (userInfoFromAuth.isEmpty() && username != null && !username.isEmpty()) {
                userInfoFromAuth = authServiceClient.getUserInfoByUsername(username);
                if (!userInfoFromAuth.isEmpty()) {
                    logger.info("Got user info by username: {}", username);
                }
            }
            
            // Если получили информацию о пользователе, используем её
            if (!userInfoFromAuth.isEmpty() && userInfoFromAuth.get("id") != null) {
                userId = userInfoFromAuth.get("id").toString();
                username = userInfoFromAuth.get("username").toString();
                userRole = userInfoFromAuth.get("role").toString();
                logger.info("Using user info from auth service: userId={}, username={}, role={}", 
                          userId, username, userRole);
            }
            
            // Подсчитываем количество и размер изображений пользователя
            for (Image image : allImages.values()) {
                String imageUserId = image.getUserId();
                logger.info("Checking image {} for userId {}", image.getId(), imageUserId);
                if ((userId != null && userId.equals(imageUserId))) {
                    userImagesCount++;
                    totalSize += image.getSize();
                }
            }

            logger.info("User {} (id={}) has {} images with total size {} bytes", 
                       username, userId, userImagesCount, totalSize);
            
            if (username != null && userRole != null) {
                // Get quota settings from auth service
                try {
                    Map<String, String> quotas = authServiceClient.getUserQuotas();
                    String quotaKey = "user_quota_" + userRole.toLowerCase();
                    String quotaValue = quotas.getOrDefault(quotaKey, "100");
                    maxImagesQuota = Integer.parseInt(quotaValue);
                    
                    // Get disk quota if available
                    String diskQuotaKey = "disk_quota_" + userRole.toLowerCase();
                    String diskQuotaValue = quotas.getOrDefault(diskQuotaKey, "1073741824"); // 1GB default
                    maxDiskSpace = Long.parseLong(diskQuotaValue);
                } catch (Exception e) {
                    logger.warn("Error fetching quota settings: {}", e.getMessage());
                }
                
                usedImagesCount = userImagesCount;
                diskSpaceUsed = totalSize;
            }
            
            // Build response
            quotaInfo.put("username", username != null ? username : "anonymous");
            quotaInfo.put("userRole", userRole != null ? userRole : "anonymous");
            quotaInfo.put("imagesUsed", usedImagesCount);
            quotaInfo.put("imagesQuota", maxImagesQuota);
            quotaInfo.put("diskSpaceUsed", diskSpaceUsed);
            quotaInfo.put("diskSpaceQuota", maxDiskSpace);
            quotaInfo.put("imagesQuotaPercentage", maxImagesQuota > 0 ? (usedImagesCount * 100 / maxImagesQuota) : 0);
            quotaInfo.put("diskQuotaPercentage", maxDiskSpace > 0 ? (diskSpaceUsed * 100 / maxDiskSpace) : 0);
            
            return ResponseEntity.ok(quotaInfo);
            
        } catch (Exception e) {
            logger.error("Error retrieving user quota information: {}", e.getMessage(), e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Внутренняя ошибка сервера: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}