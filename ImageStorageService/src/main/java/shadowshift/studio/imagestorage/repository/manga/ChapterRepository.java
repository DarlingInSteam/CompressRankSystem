package shadowshift.studio.imagestorage.repository.manga;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import shadowshift.studio.imagestorage.entity.manga.ChapterEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<ChapterEntity, String> {
    
    List<ChapterEntity> findByVolumeId(String volumeId);
    
    List<ChapterEntity> findByVolumeIdOrderByChapterNumberAsc(String volumeId);
    
    Optional<ChapterEntity> findByVolumeIdAndChapterNumber(String volumeId, double chapterNumber);
    
    @Query("SELECT c FROM ChapterEntity c JOIN c.volume v JOIN v.manga m WHERE m.id = :mangaId ORDER BY v.volumeNumber, c.chapterNumber")
    List<ChapterEntity> findAllByMangaIdOrdered(String mangaId);
    
    long countByVolumeId(String volumeId);
}