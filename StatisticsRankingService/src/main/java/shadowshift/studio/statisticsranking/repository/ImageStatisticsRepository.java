package shadowshift.studio.statisticsranking.repository;

import shadowshift.studio.statisticsranking.entity.ImageStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageStatisticsRepository extends JpaRepository<ImageStatistics, String> {
    @Query("SELECT s FROM ImageStatistics s ORDER BY (s.viewCount + s.downloadCount) DESC")
    List<ImageStatistics> findMostPopular();
    
    @Query("SELECT s FROM ImageStatistics s ORDER BY s.viewCount DESC")
    List<ImageStatistics> findMostViewed();
    
    @Query("SELECT s FROM ImageStatistics s ORDER BY s.downloadCount DESC") 
    List<ImageStatistics> findMostDownloaded();
}