package shadowshift.studio.imagestorage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shadowshift.studio.imagestorage.entity.ImageEntity;

public interface ImageRepository extends JpaRepository<ImageEntity, String> {
    // Spring Data JPA will automatically implement basic CRUD operations
}