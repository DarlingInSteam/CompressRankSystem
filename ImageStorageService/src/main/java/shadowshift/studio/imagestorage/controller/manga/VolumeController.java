package shadowshift.studio.imagestorage.controller.manga;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shadowshift.studio.imagestorage.model.manga.Volume;
import shadowshift.studio.imagestorage.service.manga.VolumeService;

import java.util.List;

@RestController
@RequestMapping("/api/manga/volumes")
@Tag(name = "Manga Volumes", description = "API для управления томами манги")
public class VolumeController {

    private static final Logger logger = LoggerFactory.getLogger(VolumeController.class);
    private final VolumeService volumeService;

    public VolumeController(VolumeService volumeService) {
        this.volumeService = volumeService;
    }

    @Operation(summary = "Create a new volume", description = "Creates a new volume for a manga")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Volume created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Volume.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Manga not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/{mangaId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Volume> createVolume(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String mangaId,
            @RequestBody Volume volume) {
        
        logger.info("Creating new volume for manga {}: {}", mangaId, volume.getTitle());
        Volume createdVolume = volumeService.createVolume(mangaId, volume);
        
        if (createdVolume == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVolume);
    }

    @Operation(summary = "Update a volume", description = "Updates an existing volume")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volume updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Volume.class))),
            @ApiResponse(responseCode = "404", description = "Volume not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Volume> updateVolume(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String id,
            @RequestBody Volume volume) {
        
        logger.info("Updating volume with id: {}", id);
        Volume updatedVolume = volumeService.updateVolume(id, volume);
        
        if (updatedVolume == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedVolume);
    }

    @Operation(summary = "Get volume by ID", description = "Returns a volume with optional chapter details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volume found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Volume.class))),
            @ApiResponse(responseCode = "404", description = "Volume not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Volume> getVolume(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Whether to include chapters in the response")
            @RequestParam(required = false, defaultValue = "false") boolean includeChapters) {
        
        logger.info("Getting volume with id: {}, includeChapters: {}", id, includeChapters);
        Volume volume = volumeService.getVolume(id, includeChapters);
        
        if (volume == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Track view
        volumeService.incrementViewCount(id);
        
        return ResponseEntity.ok(volume);
    }

    @Operation(summary = "Get all volumes for a manga", description = "Returns all volumes for the specified manga")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volumes retrieved successfully")
    })
    @GetMapping("/manga/{mangaId}")
    public ResponseEntity<List<Volume>> getVolumesByMangaId(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String mangaId) {
        
        logger.info("Getting volumes for manga: {}", mangaId);
        List<Volume> volumes = volumeService.getVolumesByMangaId(mangaId);
        return ResponseEntity.ok(volumes);
    }

    @Operation(summary = "Delete a volume", description = "Deletes a volume and all its related content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Volume deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Volume not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVolume(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String id) {
        
        logger.info("Deleting volume with id: {}", id);
        boolean deleted = volumeService.deleteVolume(id);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Set volume cover image", description = "Sets an image as the volume's cover image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cover image set successfully"),
            @ApiResponse(responseCode = "404", description = "Volume not found")
    })
    @PutMapping("/{id}/cover-image/{imageId}")
    public ResponseEntity<Volume> setVolumeCoverImage(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Image ID to use as cover", required = true)
            @PathVariable String imageId) {
        
        logger.info("Setting cover image {} for volume {}", imageId, id);
        Volume updatedVolume = volumeService.setVolumeCoverImage(id, imageId);
        
        if (updatedVolume == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedVolume);
    }
}