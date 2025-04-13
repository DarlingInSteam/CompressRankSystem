package com.shadowshiftstudio.compressionservice.service.image;

import com.shadowshiftstudio.compressionservice.entity.ImageStatisticsEntity;
import com.shadowshiftstudio.compressionservice.repository.ImageStatisticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ImageStatisticsService {

    private final ImageStatisticsRepository statisticsRepository;

    @Autowired
    public ImageStatisticsService(ImageStatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    @Transactional
    public void incrementViewCount(String imageId) {
        ImageStatisticsEntity stats = findOrCreateStatistics(imageId);
        stats.incrementViewCount();
        statisticsRepository.save(stats);
    }

    @Transactional
    public void incrementDownloadCount(String imageId) {
        ImageStatisticsEntity stats = findOrCreateStatistics(imageId);
        stats.incrementDownloadCount();
        statisticsRepository.save(stats);
    }

    private ImageStatisticsEntity findOrCreateStatistics(String imageId) {
        return statisticsRepository.findById(imageId)
                .orElse(new ImageStatisticsEntity(imageId));
    }

    public List<ImageStatisticsEntity> getMostPopularImages() {
        return statisticsRepository.findMostPopular();
    }
    
    /**
     * Получает список изображений, отсортированных по количеству просмотров
     * @return список изображений, отсортированных по просмотрам в убывающем порядке
     */
    public List<ImageStatisticsEntity> getMostViewedImages() {
        return statisticsRepository.findMostViewed();
    }
    
    /**
     * Получает список изображений, отсортированных по количеству скачиваний
     * @return список изображений, отсортированных по скачиваниям в убывающем порядке
     */
    public List<ImageStatisticsEntity> getMostDownloadedImages() {
        return statisticsRepository.findMostDownloaded();
    }
    
    public ImageStatisticsEntity getStatisticsForImage(String imageId) {
        return statisticsRepository.findById(imageId)
                .orElse(new ImageStatisticsEntity(imageId));
    }
    
    /**
     * Получает статистику для указанного изображения.
     * Синоним для метода getStatisticsForImage для обеспечения обратной совместимости.
     * 
     * @param imageId идентификатор изображения
     * @return объект статистики или новый объект с нулевыми счетчиками, если статистика не найдена
     */
    public ImageStatisticsEntity getImageStatistics(String imageId) {
        return getStatisticsForImage(imageId);
    }
}