package shadowshift.studio.imagestorage.entity.manga;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "manga")
public class MangaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String author;
    
    @Column
    private String artist;
    
    // Reference to the preview image
    private String previewImageId;
    
    @OneToMany(mappedBy = "manga", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("volumeNumber ASC")
    private List<VolumeEntity> volumes = new ArrayList<>();
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // User who uploaded/created the manga
    private String userId;
    
    // Additional metadata
    private boolean isPublished = false;
    private String status = "ongoing"; // ongoing, completed, hiatus
    private String genres;
    private int viewCount = 0;

    public MangaEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getArtist() {
        return artist;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }

    public String getPreviewImageId() {
        return previewImageId;
    }

    public void setPreviewImageId(String previewImageId) {
        this.previewImageId = previewImageId;
    }

    public List<VolumeEntity> getVolumes() {
        return volumes;
    }

    public void setVolumes(List<VolumeEntity> volumes) {
        this.volumes = volumes;
    }
    
    public void addVolume(VolumeEntity volume) {
        volumes.add(volume);
        volume.setManga(this);
    }
    
    public void removeVolume(VolumeEntity volume) {
        volumes.remove(volume);
        volume.setManga(null);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isPublished() {
        return isPublished;
    }

    public void setPublished(boolean published) {
        isPublished = published;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGenres() {
        return genres;
    }

    public void setGenres(String genres) {
        this.genres = genres;
    }

    public int getViewCount() {
        return viewCount;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }
    
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}