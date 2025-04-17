package shadowshift.studio.statisticsranking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import shadowshift.studio.statisticsranking.entity.ImageStatistics;
import shadowshift.studio.statisticsranking.repository.ImageStatisticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ImageStatisticsService {
    private static final Logger logger = LoggerFactory.getLogger(ImageStatisticsService.class);

    private final ImageStatisticsRepository statisticsRepository;

    @Autowired
    public ImageStatisticsService(ImageStatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    @Transactional
    public void incrementViewCount(String imageId) {
        ImageStatistics stats = findOrCreateStatistics(imageId);
        stats.incrementViewCount();
        logger.info("Incremented view count to " + stats.getViewCount() + " for image ID: " + imageId);
        statisticsRepository.save(stats);
    }

    @Transactional
    public void incrementDownloadCount(String imageId) {
        ImageStatistics stats = findOrCreateStatistics(imageId);
        stats.incrementDownloadCount();
        logger.info("Incremented download count to " + stats.getDownloadCount() + " for image ID: " + imageId);
        statisticsRepository.save(stats);
    }

    private ImageStatistics findOrCreateStatistics(String imageId) {
        return statisticsRepository.findById(imageId)
                .orElse(new ImageStatistics(imageId));
    }

    public List<ImageStatistics> getMostPopularImages() {
        return statisticsRepository.findMostPopular();
    }
    
    /**
     * Получает список изображений, отсортированных по количеству просмотров
     * @return список изображений, отсортированных по просмотрам в убывающем порядке
     */
    public List<ImageStatistics> getMostViewedImages() {
        return statisticsRepository.findMostViewed();
    }
    
    /**
     * Получает список изображений, отсортированных по количеству скачиваний
     * @return список изображений, отсортированных по скачиваниям в убывающем порядке
     */
    public List<ImageStatistics> getMostDownloadedImages() {
        return statisticsRepository.findMostDownloaded();
    }
    
    /**
     * Получает статистику для указанного изображения
     * @param imageId идентификатор изображения
     * @return объект статистики или новый объект с нулевыми счетчиками, если статистика не найдена
     */
    public ImageStatistics getImageStatistics(String imageId) {
        return statisticsRepository.findById(imageId)
                .orElse(new ImageStatistics(imageId));
    }
    
    /**
     * Получает статистику для всех изображений
     * @return список объектов статистики для всех изображений
     */
    public List<ImageStatistics> getAllImageStatistics() {
        return statisticsRepository.findAll();
    }
}