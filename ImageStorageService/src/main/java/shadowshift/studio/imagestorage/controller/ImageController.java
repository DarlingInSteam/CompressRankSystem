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
import shadowshift.studio.imagestorage.model.Image;
import shadowshift.studio.imagestorage.service.ImageStorageService;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@Tag(name = "Image Storage", description = "API for managing images in storage")
public class ImageController {

    private final ImageStorageService imageStorageService;

    @Autowired
    public ImageController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @Operation(summary = "Upload an image", description = "Uploads a new image to storage")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Image uploaded successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Image.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Image> uploadImage(
            @Parameter(description = "Image file to upload", required = true)
            @RequestParam("file") MultipartFile file) {
        try {
            Image image = imageStorageService.storeImage(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(image);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(metadata.getContentType()));
            
            if (download) {
                headers.setContentDispositionFormData("attachment", metadata.getOriginalFilename());
            }

            return ResponseEntity.ok().headers(headers).body(imageData);
        } catch (IOException e) {
            e.printStackTrace();
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
            Map<String, Image> images = imageStorageService.getAllImageMetadata();
            
            // Логируем количество найденных изображений
            System.out.println("Found " + images.size() + " images in storage");
            
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error retrieving all images: " + e.getMessage());
            
            // Возвращаем подробную информацию об ошибке для отладки
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error retrieving images: " + e.getMessage());
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