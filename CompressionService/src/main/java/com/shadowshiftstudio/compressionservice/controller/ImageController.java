package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.entity.ImageStatisticsEntity;
import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.image.ImageStatisticsService;
import com.shadowshiftstudio.compressionservice.service.client.ImageStorageClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/images")
@Tag(name = "Image Management", description = "API for uploading, retrieving and managing images")
public class ImageController {

    @Value("${storage.service.url:http://localhost:8081}")
    private String storageServiceUrl;
    
    private final ImageStorageClient imageStorageClient;
    private final ImageStatisticsService statisticsService;

    @Autowired
    public ImageController(ImageStorageClient imageStorageClient, ImageStatisticsService statisticsService) {
        this.imageStorageClient = imageStorageClient;
        this.statisticsService = statisticsService;
    }

    /**
     * Upload a new image
     */
    @Operation(
        summary = "Upload an image",
        description = "Uploads a new image to the system"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Image uploaded successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Image> uploadImage(
            @Parameter(description = "Image file to upload", required = true)
            @RequestParam("file") MultipartFile file) {
        try {
            // For file uploads, we need to forward to the storage service's REST API
            // Since we can't easily send binary data through the message broker
            // In a real implementation, you might use RestTemplate to forward the request
            
            // Redirect the client to upload directly to the storage service
            HttpHeaders headers = new HttpHeaders();
            headers.add("Location", storageServiceUrl + "/api/images");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Please upload directly to the storage service");
            response.put("uploadUrl", storageServiceUrl + "/api/images");
            
            return ResponseEntity
                .status(HttpStatus.TEMPORARY_REDIRECT)
                .headers(headers)
                .build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get image by ID
     */
    @Operation(
        summary = "Get an image",
        description = "Returns an image by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Image found and returned",
            content = @Content(mediaType = "image/*")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Image not found"
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Whether to download the image")
            @RequestParam(required = false, defaultValue = "false") boolean download) {
        try {
            // Get image data from storage service
            byte[] imageData = imageStorageClient.getImage(id);
            if (imageData == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Get metadata for proper content type
            Image metadata = imageStorageClient.getImageMetadata(id);
            if (metadata == null) {
                return ResponseEntity.notFound().build();
            }

            // Update view statistics
            statisticsService.incrementViewCount(id);
            
            // If download requested, increment download counter
            if (download) {
                statisticsService.incrementDownloadCount(id);
            }
            
            // Set appropriate headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(metadata.getContentType()));
            
            if (download) {
                headers.setContentDispositionFormData("attachment", metadata.getOriginalFilename());
            }

            return ResponseEntity.ok().headers(headers).body(imageData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get image metadata
     */
    @Operation(
        summary = "Get image metadata",
        description = "Returns metadata for an image"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Metadata returned successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Image not found"
        )
    })
    @GetMapping("/{id}/metadata")
    public ResponseEntity<Image> getImageMetadata(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id) {
        Image image = imageStorageClient.getImageMetadata(id);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(image);
    }

    /**
     * Delete an image
     */
    @Operation(
        summary = "Delete an image",
        description = "Deletes an image from the system"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Image deleted successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Image not found"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String id) {
        try {
            boolean deleted = imageStorageClient.deleteImage(id);
            if (!deleted) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all images metadata
     */
    @Operation(
        summary = "Get all images metadata",
        description = "Returns a list of all images with their metadata"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Success",
            content = @Content(mediaType = "application/json")
        )
    })
    @GetMapping
    public ResponseEntity<Map<String, Image>> getAllImages() {
        Map<String, Image> images = imageStorageClient.getAllImages();
        return ResponseEntity.ok(images);
    }

    /**
     * Get statistics for all images
     */
    @Operation(
        summary = "Get image statistics",
        description = "Returns statistics (views, downloads) for all images"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Statistics returned successfully",
            content = @Content(mediaType = "application/json")
        )
    })
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAllImageStatistics() {
        try {
            Map<String, Object> response = new HashMap<>();
            List<ImageStatisticsEntity> allStats = statisticsService.getAllImageStatistics();
            
            Map<String, Map<String, Integer>> stats = new HashMap<>();
            for (ImageStatisticsEntity stat : allStats) {
                Map<String, Integer> imageStat = new HashMap<>();
                imageStat.put("viewCount", stat.getViewCount());
                imageStat.put("downloadCount", stat.getDownloadCount());
                stats.put(stat.getImageId(), imageStat);
            }
            
            response.put("statistics", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}