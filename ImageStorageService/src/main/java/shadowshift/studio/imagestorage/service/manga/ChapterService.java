package shadowshift.studio.imagestorage.service.manga;

import shadowshift.studio.imagestorage.model.manga.Chapter;
import java.util.List;

/**
 * Service for managing manga chapters
 */
public interface ChapterService {
    
    /**
     * Create a new chapter for a volume
     * 
     * @param volumeId volume ID
     * @param chapter chapter data to create
     * @return created chapter
     */
    Chapter createChapter(String volumeId, Chapter chapter);
    
    /**
     * Update an existing chapter
     * 
     * @param id chapter ID
     * @param chapter chapter data to update
     * @return updated chapter
     */
    Chapter updateChapter(String id, Chapter chapter);
    
    /**
     * Get a chapter by ID
     * 
     * @param id chapter ID
     * @param includePages whether to include pages in the response
     * @return chapter data, or null if not found
     */
    Chapter getChapter(String id, boolean includePages);
    
    /**
     * Get all chapters for a volume
     * 
     * @param volumeId volume ID
     * @return list of chapters
     */
    List<Chapter> getChaptersByVolumeId(String volumeId);
    
    /**
     * Get all chapters for a manga ordered by volume and chapter number
     * 
     * @param mangaId manga ID
     * @return ordered list of chapters
     */
    List<Chapter> getChaptersByMangaId(String mangaId);
    
    /**
     * Delete a chapter
     * 
     * @param id chapter ID
     * @return true if deleted, false if not found
     */
    boolean deleteChapter(String id);
    
    /**
     * Increment view count for a chapter
     * 
     * @param id chapter ID
     */
    void incrementViewCount(String id);
}