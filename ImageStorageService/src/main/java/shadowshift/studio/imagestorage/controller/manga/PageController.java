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
import org.springframework.web.multipart.MultipartFile;
import shadowshift.studio.imagestorage.model.manga.Page;
import shadowshift.studio.imagestorage.service.manga.PageService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/manga/pages")
@Tag(name = "Manga Pages", description = "API для управления страницами манги")
public class PageController {

    private static final Logger logger = LoggerFactory.getLogger(PageController.class);
    private final PageService pageService;

    public PageController(PageService pageService) {
        this.pageService = pageService;
    }

    @Operation(summary = "Create a new page", description = "Creates a new page for a chapter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Page created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Chapter not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/{chapterId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Page> createPage(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String chapterId,
            @RequestBody Page page) {
        
        logger.info("Creating new page for chapter {}: page {}", chapterId, page.getPageNumber());
        Page createdPage = pageService.createPage(chapterId, page);
        
        if (createdPage == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPage);
    }

    @Operation(summary = "Upload and create a new page", description = "Uploads an image and creates a new page for a chapter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Page uploaded and created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Chapter not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/{chapterId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Page> uploadPage(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String chapterId,
            @Parameter(description = "Page number (0 for auto-assignment)")
            @RequestParam(value = "pageNumber", defaultValue = "0") int pageNumber,
            @Parameter(description = "Image file to upload", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        logger.info("Uploading new page for chapter {}: page {}, filename: {}", 
                chapterId, pageNumber, file.getOriginalFilename());
        
        try {
            // Use a default user ID if not provided
            if (userId == null || userId.isEmpty()) {
                userId = "system";
            }
            
            Page uploadedPage = pageService.uploadPage(chapterId, pageNumber, file, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(uploadedPage);
        } catch (IOException e) {
            logger.error("Error uploading page: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Update a page", description = "Updates an existing page")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Page updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Page not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Page> updatePage(
            @Parameter(description = "Page ID", required = true)
            @PathVariable String id,
            @RequestBody Page page) {
        
        logger.info("Updating page with id: {}", id);
        Page updatedPage = pageService.updatePage(id, page);
        
        if (updatedPage == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedPage);
    }

    @Operation(summary = "Get page by ID", description = "Returns a page by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Page found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Page not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Page> getPage(
            @Parameter(description = "Page ID", required = true)
            @PathVariable String id) {
        
        logger.info("Getting page with id: {}", id);
        Page page = pageService.getPage(id);
        
        if (page == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Get all pages for a chapter", description = "Returns all pages for the specified chapter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pages retrieved successfully")
    })
    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<List<Page>> getPagesByChapterId(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String chapterId) {
        
        logger.info("Getting pages for chapter: {}", chapterId);
        List<Page> pages = pageService.getPagesByChapterId(chapterId);
        return ResponseEntity.ok(pages);
    }

    @Operation(summary = "Delete a page", description = "Deletes a page")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Page deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Page not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePage(
            @Parameter(description = "Page ID", required = true)
            @PathVariable String id) {
        
        logger.info("Deleting page with id: {}", id);
        boolean deleted = pageService.deletePage(id);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reorder pages in a chapter", description = "Updates the order of pages in a chapter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pages reordered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/reorder/{chapterId}")
    public ResponseEntity<List<Page>> reorderPages(
            @Parameter(description = "Chapter ID", required = true)
            @PathVariable String chapterId,
            @RequestBody List<String> pageIds) {
        
        logger.info("Reordering {} pages for chapter: {}", pageIds.size(), chapterId);
        List<Page> updatedPages = pageService.reorderPages(chapterId, pageIds);
        return ResponseEntity.ok(updatedPages);
    }

    @Operation(summary = "Find page by image ID", description = "Returns a page associated with the specified image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Page found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Page not found")
    })
    @GetMapping("/image/{imageId}")
    public ResponseEntity<Page> findPageByImageId(
            @Parameter(description = "Image ID", required = true)
            @PathVariable String imageId) {
        
        logger.info("Finding page by image id: {}", imageId);
        Page page = pageService.findPageByImageId(imageId);
        
        if (page == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(page);
    }
}