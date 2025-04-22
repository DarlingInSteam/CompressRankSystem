package shadowshift.studio.imagestorage.repository.manga;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import shadowshift.studio.imagestorage.entity.manga.PageEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface PageRepository extends JpaRepository<PageEntity, String> {
    
    List<PageEntity> findByChapterId(String chapterId);
    
    List<PageEntity> findByChapterIdOrderByPageNumberAsc(String chapterId);
    
    Optional<PageEntity> findByChapterIdAndPageNumber(String chapterId, int pageNumber);
    
    Optional<PageEntity> findByImageId(String imageId);
    
    @Query("SELECT COUNT(p) FROM PageEntity p JOIN p.chapter c JOIN c.volume v JOIN v.manga m WHERE m.id = :mangaId")
    long countByMangaId(String mangaId);
    
    @Query("SELECT COUNT(p) FROM PageEntity p JOIN p.chapter c JOIN c.volume v WHERE v.id = :volumeId")
    long countByVolumeId(String volumeId);
    
    long countByChapterId(String chapterId);
}