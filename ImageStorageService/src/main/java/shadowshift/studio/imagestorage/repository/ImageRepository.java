package shadowshift.studio.imagestorage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shadowshift.studio.imagestorage.entity.ImageEntity;

import java.util.List;

public interface ImageRepository extends JpaRepository<ImageEntity, String> { 
    /**
     * Подсчитывает количество изображений, принадлежащих указанному пользователю
     * @param userId идентификатор пользователя
     * @return количество изображений пользователя
     */
    long countByUserId(String userId);
    
    /**
     * Находит все оригинальные изображения (не сжатые варианты) пользователя
     * @param userId идентификатор пользователя
     * @return список изображений пользователя
     */
    @Query("SELECT i FROM ImageEntity i WHERE i.userId = :userId AND i.originalImageId IS NULL")
    List<ImageEntity> findOriginalImagesByUserId(@Param("userId") String userId);
    
    /**
     * Находит все сжатые варианты изображений пользователя
     * @param userId идентификатор пользователя
     * @return список сжатых вариантов изображений пользователя
     */
    @Query("SELECT i FROM ImageEntity i WHERE i.userId = :userId AND i.originalImageId IS NOT NULL")
    List<ImageEntity> findCompressedImagesByUserId(@Param("userId") String userId);
}