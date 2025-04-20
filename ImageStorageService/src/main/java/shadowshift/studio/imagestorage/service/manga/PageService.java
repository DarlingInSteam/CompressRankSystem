package shadowshift.studio.imagestorage.service.manga;

import shadowshift.studio.imagestorage.model.manga.Page;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Service for managing manga pages
 */
public interface PageService {
    
    /**
     * Create a new page for a chapter
     * 
     * @param chapterId chapter ID
     * @param page page data to create
     * @return created page
     */
    Page createPage(String chapterId, Page page);
    
    /**
     * Upload and create a new page for a chapter
     * 
     * @param chapterId chapter ID
     * @param pageNumber page number
     * @param file image file to upload
     * @param userId ID of the user uploading the page
     * @return created page
     * @throws IOException if there is an error uploading the image
     */
    Page uploadPage(String chapterId, int pageNumber, MultipartFile file, String userId) throws IOException;
    
    /**
     * Update an existing page
     * 
     * @param id page ID
     * @param page page data to update
     * @return updated page
     */
    Page updatePage(String id, Page page);
    
    /**
     * Get a page by ID
     * 
     * @param id page ID
     * @return page data, or null if not found
     */
    Page getPage(String id);
    
    /**
     * Get all pages for a chapter
     * 
     * @param chapterId chapter ID
     * @return list of pages
     */
    List<Page> getPagesByChapterId(String chapterId);
    
    /**
     * Delete a page
     * 
     * @param id page ID
     * @return true if deleted, false if not found
     */
    boolean deletePage(String id);
    
    /**
     * Reorder pages in a chapter
     * 
     * @param chapterId chapter ID
     * @param pageIds ordered list of page IDs
     * @return list of updated pages
     */
    List<Page> reorderPages(String chapterId, List<String> pageIds);
    
    /**
     * Find a page by its associated image ID
     * 
     * @param imageId image ID
     * @return page data, or null if not found
     */
    Page findPageByImageId(String imageId);
}