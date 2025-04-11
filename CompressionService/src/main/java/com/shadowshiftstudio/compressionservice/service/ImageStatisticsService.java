package com.shadowshiftstudio.compressionservice.service;

import com.shadowshiftstudio.compressionservice.entity.ImageStatisticsEntity;
import com.shadowshiftstudio.compressionservice.repository.ImageStatisticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    
    public ImageStatisticsEntity getStatisticsForImage(String imageId) {
        return statisticsRepository.findById(imageId)
                .orElse(new ImageStatisticsEntity(imageId));
    }
}