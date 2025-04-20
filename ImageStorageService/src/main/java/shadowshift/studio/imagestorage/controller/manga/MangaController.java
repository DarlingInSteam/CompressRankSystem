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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shadowshift.studio.imagestorage.model.manga.Manga;
import shadowshift.studio.imagestorage.service.manga.MangaService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manga")
@Tag(name = "Manga", description = "API для управления манга контентом")
public class MangaController {

    private static final Logger logger = LoggerFactory.getLogger(MangaController.class);
    private final MangaService mangaService;

    public MangaController(MangaService mangaService) {
        this.mangaService = mangaService;
    }

    @Operation(summary = "Create a new manga", description = "Creates a new manga entity")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Manga created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Manga.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Manga> createManga(
            @RequestBody Manga manga,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        logger.info("Creating new manga: {}", manga.getTitle());
        
        try {
            // Set the user ID if provided in the header
            if (userId != null && !userId.isEmpty()) {
                manga.setUserId(userId);
            }
            
            // Set default values for required fields if missing
            if (manga.getStatus() == null || manga.getStatus().isEmpty()) {
                manga.setStatus("ongoing");
            }
            
            // Ensure artist is set if it's null
            if (manga.getArtist() == null) {
                manga.setArtist(manga.getAuthor());
            }
            
            Manga createdManga = mangaService.createManga(manga);
            logger.info("Successfully created manga with ID: {}", createdManga.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdManga);
        } catch (Exception e) {
            logger.error("Error creating manga: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Operation(summary = "Update a manga", description = "Updates an existing manga entity")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Manga updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Manga.class))),
            @ApiResponse(responseCode = "404", description = "Manga not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Manga> updateManga(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String id,
            @RequestBody Manga manga) {
        
        logger.info("Updating manga with id: {}", id);
        Manga updatedManga = mangaService.updateManga(id, manga);
        
        if (updatedManga == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedManga);
    }

    @Operation(summary = "Get manga by ID", description = "Returns a manga with optional volume details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Manga found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Manga.class))),
            @ApiResponse(responseCode = "404", description = "Manga not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Manga> getManga(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Whether to include volumes in the response")
            @RequestParam(required = false, defaultValue = "false") boolean includeVolumes) {
        
        logger.info("Getting manga with id: {}, includeVolumes: {}", id, includeVolumes);
        Manga manga = mangaService.getManga(id, includeVolumes);
        
        if (manga == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Track view
        mangaService.incrementViewCount(id);
        
        return ResponseEntity.ok(manga);
    }

    @Operation(summary = "Get all mangas", description = "Returns a paginated list of mangas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Mangas retrieved successfully")
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMangas(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Sort field")
            @RequestParam(value = "sort", defaultValue = "createdAt") String sortField,
            @Parameter(description = "Sort direction (asc or desc)")
            @RequestParam(value = "direction", defaultValue = "desc") String direction) {
        
        logger.info("Getting all mangas, page: {}, size: {}, sort: {}, direction: {}", 
                page, size, sortField, direction);
                
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        
        Page<Manga> mangaPage = mangaService.getAllMangas(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("mangas", mangaPage.getContent());
        response.put("currentPage", mangaPage.getNumber());
        response.put("totalItems", mangaPage.getTotalElements());
        response.put("totalPages", mangaPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get mangas by user ID", description = "Returns mangas uploaded by a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Mangas retrieved successfully")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Manga>> getMangasByUserId(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        
        logger.info("Getting mangas for user: {}", userId);
        List<Manga> mangas = mangaService.getMangasByUserId(userId);
        return ResponseEntity.ok(mangas);
    }

    @Operation(summary = "Delete a manga", description = "Deletes a manga and all its related content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Manga deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Manga not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteManga(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String id) {
        
        logger.info("Deleting manga with id: {}", id);
        boolean deleted = mangaService.deleteManga(id);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Search mangas by title", description = "Returns mangas matching the search query")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMangasByTitle(
            @Parameter(description = "Search query")
            @RequestParam String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        logger.info("Searching mangas with title containing: {}", query);
        Pageable pageable = PageRequest.of(page, size);
        Page<Manga> mangaPage = mangaService.searchMangasByTitle(query, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("mangas", mangaPage.getContent());
        response.put("currentPage", mangaPage.getNumber());
        response.put("totalItems", mangaPage.getTotalElements());
        response.put("totalPages", mangaPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Filter mangas by genre", description = "Returns mangas matching the specified genre")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Filter results retrieved successfully")
    })
    @GetMapping("/genre/{genre}")
    public ResponseEntity<Map<String, Object>> filterMangasByGenre(
            @Parameter(description = "Genre to filter by")
            @PathVariable String genre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        logger.info("Filtering mangas by genre: {}", genre);
        Pageable pageable = PageRequest.of(page, size);
        Page<Manga> mangaPage = mangaService.filterMangasByGenre(genre, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("mangas", mangaPage.getContent());
        response.put("currentPage", mangaPage.getNumber());
        response.put("totalItems", mangaPage.getTotalElements());
        response.put("totalPages", mangaPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get published mangas", description = "Returns mangas that are marked as published")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Published mangas retrieved successfully")
    })
    @GetMapping("/published")
    public ResponseEntity<Map<String, Object>> getPublishedMangas(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        logger.info("Getting published mangas");
        Pageable pageable = PageRequest.of(page, size);
        Page<Manga> mangaPage = mangaService.getPublishedMangas(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("mangas", mangaPage.getContent());
        response.put("currentPage", mangaPage.getNumber());
        response.put("totalItems", mangaPage.getTotalElements());
        response.put("totalPages", mangaPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Set manga preview image", description = "Sets an image as the manga's preview image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preview image set successfully"),
            @ApiResponse(responseCode = "404", description = "Manga not found")
    })
    @PutMapping("/{id}/preview-image/{imageId}")
    public ResponseEntity<Manga> setMangaPreviewImage(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Image ID to use as preview", required = true)
            @PathVariable String imageId) {
        
        logger.info("Setting preview image {} for manga {}", imageId, id);
        Manga updatedManga = mangaService.setMangaPreviewImage(id, imageId);
        
        if (updatedManga == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedManga);
    }
}
