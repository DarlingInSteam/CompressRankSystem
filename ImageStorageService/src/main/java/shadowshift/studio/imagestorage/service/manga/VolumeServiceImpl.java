package shadowshift.studio.imagestorage.service.manga;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shadowshift.studio.imagestorage.entity.manga.MangaEntity;
import shadowshift.studio.imagestorage.entity.manga.VolumeEntity;
import shadowshift.studio.imagestorage.mapper.manga.VolumeMapper;
import shadowshift.studio.imagestorage.model.manga.Volume;
import shadowshift.studio.imagestorage.repository.manga.ChapterRepository;
import shadowshift.studio.imagestorage.repository.manga.MangaRepository;
import shadowshift.studio.imagestorage.repository.manga.PageRepository;
import shadowshift.studio.imagestorage.repository.manga.VolumeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VolumeServiceImpl implements VolumeService {

    private static final Logger logger = LoggerFactory.getLogger(VolumeServiceImpl.class);
    
    private final MangaRepository mangaRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final PageRepository pageRepository;
    private final VolumeMapper volumeMapper;

    public VolumeServiceImpl(MangaRepository mangaRepository, 
                            VolumeRepository volumeRepository,
                            ChapterRepository chapterRepository,
                            PageRepository pageRepository,
                            VolumeMapper volumeMapper) {
        this.mangaRepository = mangaRepository;
        this.volumeRepository = volumeRepository;
        this.chapterRepository = chapterRepository;
        this.pageRepository = pageRepository;
        this.volumeMapper = volumeMapper;
    }

    @Override
    @Transactional
    public Volume createVolume(String mangaId, Volume volume) {
        logger.info("Creating new volume for manga {}: {}", mangaId, volume.getTitle());
        MangaEntity mangaEntity = mangaRepository.findById(mangaId).orElse(null);
        if (mangaEntity == null) {
            logger.warn("Cannot create volume: manga not found with id: {}", mangaId);
            return null;
        }
        
        VolumeEntity entity = volumeMapper.toEntity(volume);
        entity.setManga(mangaEntity);
        
        // Set volume number automatically if not provided
        if (entity.getVolumeNumber() <= 0) {
            long volumeCount = volumeRepository.countByMangaId(mangaId);
            entity.setVolumeNumber((int) volumeCount + 1);
        }
        
        VolumeEntity savedEntity = volumeRepository.save(entity);
        return volumeMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public Volume updateVolume(String id, Volume volume) {
        logger.info("Updating volume with id: {}", id);
        VolumeEntity existingEntity = volumeRepository.findById(id).orElse(null);
        if (existingEntity == null) {
            logger.warn("Volume not found with id: {}", id);
            return null;
        }

        VolumeEntity updatedEntity = volumeMapper.toEntity(volume, existingEntity);
        VolumeEntity savedEntity = volumeRepository.save(updatedEntity);
        return volumeMapper.toModel(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Volume getVolume(String id, boolean includeChapters) {
        logger.info("Getting volume with id: {}, includeChapters: {}", id, includeChapters);
        VolumeEntity entity = volumeRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Volume not found with id: {}", id);
            return null;
        }
        
        Volume volume = volumeMapper.toModel(entity, includeChapters);
        
        // Add statistics if chapters are not included
        if (!includeChapters) {
            volume.setChapterCount((int) chapterRepository.countByVolumeId(id));
            volume.setPageCount((int) pageRepository.countByVolumeId(id));
        }
        
        return volume;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Volume> getVolumesByMangaId(String mangaId) {
        logger.info("Getting volumes for manga: {}", mangaId);
        List<VolumeEntity> entities = volumeRepository.findByMangaIdOrderByVolumeNumberAsc(mangaId);
        return entities.stream()
                .map(entity -> volumeMapper.toModel(entity, true))  // Изменение: включаем главы в результат (true)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deleteVolume(String id) {
        logger.info("Deleting volume with id: {}", id);
        if (!volumeRepository.existsById(id)) {
            logger.warn("Volume not found with id: {}", id);
            return false;
        }
        
        volumeRepository.deleteById(id);
        logger.info("Deleted volume with id: {}", id);
        return true;
    }

    @Override
    @Transactional
    public Volume setVolumeCoverImage(String id, String imageId) {
        logger.info("Setting cover image {} for volume {}", imageId, id);
        VolumeEntity entity = volumeRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Volume not found with id: {}", id);
            return null;
        }

        entity.setCoverImageId(imageId);
        VolumeEntity savedEntity = volumeRepository.save(entity);
        return volumeMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public void incrementViewCount(String id) {
        logger.debug("Incrementing view count for volume {}", id);
        VolumeEntity entity = volumeRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Volume not found with id: {}", id);
            return;
        }

        entity.incrementViewCount();
        volumeRepository.save(entity);
    }
}