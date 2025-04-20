package shadowshift.studio.imagestorage.repository.manga;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import shadowshift.studio.imagestorage.entity.manga.MangaEntity;

import java.util.List;

@Repository
public interface MangaRepository extends JpaRepository<MangaEntity, String> {
    
    List<MangaEntity> findByUserId(String userId);
    
    Page<MangaEntity> findByIsPublishedTrue(Pageable pageable);
    
    Page<MangaEntity> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    Page<MangaEntity> findByGenresContainingIgnoreCase(String genre, Pageable pageable);
    
    long countByUserId(String userId);
}