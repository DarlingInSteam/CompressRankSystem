package shadowshift.studio.imagestorage.service.manga;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import shadowshift.studio.imagestorage.model.manga.Manga;

import java.util.List;

/**
 * Service for managing manga
 */
public interface MangaService {
    
    /**
     * Create a new manga
     * 
     * @param manga manga data to create
     * @return created manga
     */
    Manga createManga(Manga manga);
    
    /**
     * Update an existing manga
     * 
     * @param id manga ID
     * @param manga manga data to update
     * @return updated manga
     */
    Manga updateManga(String id, Manga manga);
    
    /**
     * Get a manga by ID
     * 
     * @param id manga ID
     * @param includeVolumes whether to include volumes in the response
     * @return manga data, or null if not found
     */
    Manga getManga(String id, boolean includeVolumes);
    
    /**
     * Get all mangas with pagination
     * 
     * @param pageable pagination information
     * @return page of mangas
     */
    Page<Manga> getAllMangas(Pageable pageable);
    
    /**
     * Get mangas by user ID
     * 
     * @param userId user ID
     * @return list of mangas
     */
    List<Manga> getMangasByUserId(String userId);
    
    /**
     * Delete a manga
     * 
     * @param id manga ID
     * @return true if deleted, false if not found
     */
    boolean deleteManga(String id);
    
    /**
     * Search mangas by title
     * 
     * @param title search query
     * @param pageable pagination information
     * @return page of mangas matching the search
     */
    Page<Manga> searchMangasByTitle(String title, Pageable pageable);
    
    /**
     * Filter mangas by genre
     * 
     * @param genre genre to filter by
     * @param pageable pagination information
     * @return page of mangas with the specified genre
     */
    Page<Manga> filterMangasByGenre(String genre, Pageable pageable);
    
    /**
     * Get published mangas
     * 
     * @param pageable pagination information
     * @return page of published mangas
     */
    Page<Manga> getPublishedMangas(Pageable pageable);
    
    /**
     * Set manga preview image
     * 
     * @param id manga ID
     * @param imageId image ID to use as preview
     * @return updated manga
     */
    Manga setMangaPreviewImage(String id, String imageId);
    
    /**
     * Increment view count for a manga
     * 
     * @param id manga ID
     */
    void incrementViewCount(String id);
}