package shadowshift.studio.imagestorage.repository.manga;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import shadowshift.studio.imagestorage.entity.manga.VolumeEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolumeRepository extends JpaRepository<VolumeEntity, String> {
    
    List<VolumeEntity> findByMangaId(String mangaId);
    
    List<VolumeEntity> findByMangaIdOrderByVolumeNumberAsc(String mangaId);
    
    Optional<VolumeEntity> findByMangaIdAndVolumeNumber(String mangaId, int volumeNumber);
    
    long countByMangaId(String mangaId);
}