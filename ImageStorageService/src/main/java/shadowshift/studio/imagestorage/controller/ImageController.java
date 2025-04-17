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

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/images")
@Tag(name = "Image Storage", description = "API для управления изображениями в хранилище")
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final StatisticsEventSender statisticsEventSender;
    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);

    @Autowired
    public ImageController(ImageStorageService imageStorageService, StatisticsEventSender statisticsEventSender) {
        this.imageStorageService = imageStorageService;
        this.statisticsEventSender = statisticsEventSender;
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
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            // Создаем объект UserInfo из заголовков запроса
            UserInfo userInfo = null;
            if (username != null && userRole != null) {
                userInfo = new UserInfo(username, userRole);
                logger.info("User {} with role {} is uploading a file: {} ({})", username, userRole, file.getOriginalFilename(), file.getSize());
            } else {
                logger.info("Anonymous upload of file: {} ({})", file.getOriginalFilename(), file.getSize());
            }
            
            Image image = imageStorageService.storeImage(file, userInfo);
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
}