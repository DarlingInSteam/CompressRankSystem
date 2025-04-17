package shadowshift.studio.statisticsranking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "image_statistics")
public class ImageStatistics {

    @Id
    private String imageId;
    
    @Column(nullable = false)
    private int viewCount;
    
    @Column(nullable = false)
    private int downloadCount;
    
    @Column
    private LocalDateTime lastViewedAt;
    
    @Column
    private LocalDateTime lastDownloadedAt;

    public ImageStatistics() {
    }

    public ImageStatistics(String imageId) {
        this.imageId = imageId;
        this.viewCount = 0;
        this.downloadCount = 0;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }

    public int getViewCount() {
        return viewCount;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }
    
    public int incrementViewCount() {
        this.viewCount++;
        this.lastViewedAt = LocalDateTime.now();
        return this.viewCount;
    }

    public int getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(int downloadCount) {
        this.downloadCount = downloadCount;
    }
    
    public int incrementDownloadCount() {
        this.downloadCount++;
        this.lastDownloadedAt = LocalDateTime.now();
        return this.downloadCount;
    }

    public LocalDateTime getLastViewedAt() {
        return lastViewedAt;
    }

    public void setLastViewedAt(LocalDateTime lastViewedAt) {
        this.lastViewedAt = lastViewedAt;
    }

    public LocalDateTime getLastDownloadedAt() {
        return lastDownloadedAt;
    }

    public void setLastDownloadedAt(LocalDateTime lastDownloadedAt) {
        this.lastDownloadedAt = lastDownloadedAt;
    }
    
    public int getWeeklyPopularity() {
        return viewCount + downloadCount;
    }
}