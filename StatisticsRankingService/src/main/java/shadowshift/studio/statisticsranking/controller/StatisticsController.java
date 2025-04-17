package shadowshift.studio.statisticsranking.controller;

import shadowshift.studio.statisticsranking.entity.ImageStatistics;
import shadowshift.studio.statisticsranking.service.ImageStatisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    
    private final ImageStatisticsService statisticsService;
    
    @Autowired
    public StatisticsController(ImageStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStatistics() {
        try {
            Map<String, Object> response = new HashMap<>();
            List<ImageStatistics> allStats = statisticsService.getAllImageStatistics();
            
            Map<String, Map<String, Object>> stats = new HashMap<>();
            for (ImageStatistics stat : allStats) {
                Map<String, Object> imageStat = new HashMap<>();
                imageStat.put("viewCount", stat.getViewCount());
                imageStat.put("downloadCount", stat.getDownloadCount());
                imageStat.put("lastViewedAt", stat.getLastViewedAt());
                imageStat.put("lastDownloadedAt", stat.getLastDownloadedAt());
                
                stats.put(stat.getImageId(), imageStat);
            }
            
            response.put("statistics", stats);
            logger.debug("Returning statistics for {} images", stats.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{imageId}")
    public ResponseEntity<Map<String, Object>> getImageStatistics(@PathVariable String imageId) {
        try {
            ImageStatistics stats = statisticsService.getImageStatistics(imageId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("imageId", stats.getImageId());
            response.put("viewCount", stats.getViewCount());
            response.put("downloadCount", stats.getDownloadCount());
            response.put("lastViewedAt", stats.getLastViewedAt());
            response.put("lastDownloadedAt", stats.getLastDownloadedAt());
            
            logger.debug("Returning statistics for image: {}", imageId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving statistics for image {}: {}", imageId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/popular")
    public ResponseEntity<List<Map<String, Object>>> getMostPopularImages() {
        try {
            List<ImageStatistics> popularImages = statisticsService.getMostPopularImages();
            
            List<Map<String, Object>> response = popularImages.stream()
                .map(stat -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("imageId", stat.getImageId());
                    item.put("viewCount", stat.getViewCount());
                    item.put("downloadCount", stat.getDownloadCount());
                    item.put("totalCount", stat.getViewCount() + stat.getDownloadCount());
                    return item;
                })
                .collect(Collectors.toList());
            
            logger.debug("Returning {} most popular images", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving popular images: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/most-viewed")
    public ResponseEntity<List<Map<String, Object>>> getMostViewedImages() {
        try {
            List<ImageStatistics> mostViewed = statisticsService.getMostViewedImages();
            
            List<Map<String, Object>> response = mostViewed.stream()
                .map(stat -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("imageId", stat.getImageId());
                    item.put("viewCount", stat.getViewCount());
                    return item;
                })
                .collect(Collectors.toList());
            
            logger.debug("Returning {} most viewed images", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving most viewed images: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/most-downloaded")
    public ResponseEntity<List<Map<String, Object>>> getMostDownloadedImages() {
        try {
            List<ImageStatistics> mostDownloaded = statisticsService.getMostDownloadedImages();
            
            List<Map<String, Object>> response = mostDownloaded.stream()
                .map(stat -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("imageId", stat.getImageId());
                    item.put("downloadCount", stat.getDownloadCount());
                    return item;
                })
                .collect(Collectors.toList());
            
            logger.debug("Returning {} most downloaded images", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving most downloaded images: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}