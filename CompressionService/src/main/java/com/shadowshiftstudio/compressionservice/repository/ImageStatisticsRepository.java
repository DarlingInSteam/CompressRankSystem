package com.shadowshiftstudio.compressionservice.repository;

import com.shadowshiftstudio.compressionservice.entity.ImageStatisticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageStatisticsRepository extends JpaRepository<ImageStatisticsEntity, String> {
    @Query("SELECT s FROM ImageStatisticsEntity s ORDER BY (s.viewCount + s.downloadCount) DESC")
    List<ImageStatisticsEntity> findMostPopular();
}