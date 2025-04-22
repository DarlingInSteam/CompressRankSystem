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
import shadowshift.studio.imagestorage.model.manga.Chapter;
import shadowshift.studio.imagestorage.service.manga.ChapterService;

import java.util.List;

@RestController
@RequestMapping("/api/manga/chapters")
@Tag(name = "Manga Chapters", description = "API для управления главами манги")
public class ChapterController {

    private static final Logger logger = LoggerFactory.getLogger(ChapterController.class);
    private final ChapterService chapterService;

    public ChapterController(ChapterService chapterService) {
        this.chapterService = chapterService;
    }

    @Operation(summary = "Create a new chapter", description = "Creates a new chapter for a volume")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Chapter created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chapter.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Volume not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/{volumeId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Chapter> createChapter(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String volumeId,
            @RequestBody Chapter chapter) {
        
        logger.info("Creating new chapter for volume {}: {}", volumeId, chapter.getTitle());
        Chapter createdChapter = chapterService.createChapter(volumeId, chapter);
        
        if (createdChapter == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdChapter);
    }

    @Operation(summary = "Update a chapter", description = "Updates an existing chapter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapter updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chapter.class))),
            @ApiResponse(responseCode = "404", description = "Chapter not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Chapter> updateChapter(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String id,
            @RequestBody Chapter chapter) {
        
        logger.info("Updating chapter with id: {}", id);
        Chapter updatedChapter = chapterService.updateChapter(id, chapter);
        
        if (updatedChapter == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedChapter);
    }

    @Operation(summary = "Get chapter by ID", description = "Returns a chapter with optional page details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapter found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chapter.class))),
            @ApiResponse(responseCode = "404", description = "Chapter not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Chapter> getChapter(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Whether to include pages in the response")
            @RequestParam(required = false, defaultValue = "false") boolean includePages) {
        
        logger.info("Getting chapter with id: {}, includePages: {}", id, includePages);
        Chapter chapter = chapterService.getChapter(id, includePages);
        
        if (chapter == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Track view
        chapterService.incrementViewCount(id);
        
        return ResponseEntity.ok(chapter);
    }

    @Operation(summary = "Get all chapters for a volume", description = "Returns all chapters for the specified volume")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapters retrieved successfully")
    })
    @GetMapping("/volume/{volumeId}")
    public ResponseEntity<List<Chapter>> getChaptersByVolumeId(
            @Parameter(description = "Volume ID", required = true)
            @PathVariable String volumeId) {
        
        logger.info("Getting chapters for volume: {}", volumeId);
        List<Chapter> chapters = chapterService.getChaptersByVolumeId(volumeId);
        return ResponseEntity.ok(chapters);
    }
    
    @Operation(summary = "Get all chapters for a manga", description = "Returns all chapters for the specified manga ordered by volume and chapter number")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapters retrieved successfully")
    })
    @GetMapping("/manga/{mangaId}")
    public ResponseEntity<List<Chapter>> getChaptersByMangaId(
            @Parameter(description = "Manga ID", required = true)
            @PathVariable String mangaId) {
        
        logger.info("Getting all chapters for manga: {}", mangaId);
        List<Chapter> chapters = chapterService.getChaptersByMangaId(mangaId);
        return ResponseEntity.ok(chapters);
    }

    @Operation(summary = "Delete a chapter", description = "Deletes a chapter and all its related content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Chapter deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Chapter not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChapter(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String id) {
        
        logger.info("Deleting chapter with id: {}", id);
        boolean deleted = chapterService.deleteChapter(id);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.noContent().build();
    }
}