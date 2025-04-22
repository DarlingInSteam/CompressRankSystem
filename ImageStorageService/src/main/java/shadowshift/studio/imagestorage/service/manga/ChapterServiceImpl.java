package shadowshift.studio.imagestorage.service.manga;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shadowshift.studio.imagestorage.entity.manga.ChapterEntity;
import shadowshift.studio.imagestorage.entity.manga.VolumeEntity;
import shadowshift.studio.imagestorage.mapper.manga.ChapterMapper;
import shadowshift.studio.imagestorage.model.manga.Chapter;
import shadowshift.studio.imagestorage.repository.manga.ChapterRepository;
import shadowshift.studio.imagestorage.repository.manga.PageRepository;
import shadowshift.studio.imagestorage.repository.manga.VolumeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChapterServiceImpl implements ChapterService {

    private static final Logger logger = LoggerFactory.getLogger(ChapterServiceImpl.class);
    
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final PageRepository pageRepository;
    private final ChapterMapper chapterMapper;

    public ChapterServiceImpl(VolumeRepository volumeRepository, 
                             ChapterRepository chapterRepository,
                             PageRepository pageRepository,
                             ChapterMapper chapterMapper) {
        this.volumeRepository = volumeRepository;
        this.chapterRepository = chapterRepository;
        this.pageRepository = pageRepository;
        this.chapterMapper = chapterMapper;
    }

    @Override
    @Transactional
    public Chapter createChapter(String volumeId, Chapter chapter) {
        logger.info("Creating new chapter for volume {}: {}", volumeId, chapter.getTitle());
        VolumeEntity volumeEntity = volumeRepository.findById(volumeId).orElse(null);
        if (volumeEntity == null) {
            logger.warn("Cannot create chapter: volume not found with id: {}", volumeId);
            return null;
        }
        
        ChapterEntity entity = chapterMapper.toEntity(chapter);
        entity.setVolume(volumeEntity);
        
        // Set chapter number automatically if not provided
        if (entity.getChapterNumber() <= 0) {
            long chapterCount = chapterRepository.countByVolumeId(volumeId);
            entity.setChapterNumber(chapterCount + 1);
        }
        
        ChapterEntity savedEntity = chapterRepository.save(entity);
        
        // Explicitly add the chapter to the volume's chapter list to ensure consistency
        volumeEntity.addChapter(savedEntity);
        volumeRepository.save(volumeEntity);
        
        logger.info("Created chapter with ID: {} for volume: {}", savedEntity.getId(), volumeId);
        return chapterMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public Chapter updateChapter(String id, Chapter chapter) {
        logger.info("Updating chapter with id: {}", id);
        ChapterEntity existingEntity = chapterRepository.findById(id).orElse(null);
        if (existingEntity == null) {
            logger.warn("Chapter not found with id: {}", id);
            return null;
        }

        ChapterEntity updatedEntity = chapterMapper.toEntity(chapter, existingEntity);
        ChapterEntity savedEntity = chapterRepository.save(updatedEntity);
        return chapterMapper.toModel(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Chapter getChapter(String id, boolean includePages) {
        logger.info("Getting chapter with id: {}, includePages: {}", id, includePages);
        ChapterEntity entity = chapterRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Chapter not found with id: {}", id);
            return null;
        }
        
        Chapter chapter = chapterMapper.toModel(entity, includePages);
        
        // Add statistics if pages are not included
        if (!includePages) {
            chapter.setPageCount((int) pageRepository.countByChapterId(id));
        }
        
        return chapter;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Chapter> getChaptersByVolumeId(String volumeId) {
        logger.info("Getting chapters for volume: {}", volumeId);
        List<ChapterEntity> entities = chapterRepository.findByVolumeIdOrderByChapterNumberAsc(volumeId);
        return entities.stream()
                .map(chapterMapper::toModel)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Chapter> getChaptersByMangaId(String mangaId) {
        logger.info("Getting all chapters for manga: {}", mangaId);
        List<ChapterEntity> entities = chapterRepository.findAllByMangaIdOrdered(mangaId);
        return entities.stream()
                .map(chapterMapper::toModel)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deleteChapter(String id) {
        logger.info("Deleting chapter with id: {}", id);
        if (!chapterRepository.existsById(id)) {
            logger.warn("Chapter not found with id: {}", id);
            return false;
        }
        
        chapterRepository.deleteById(id);
        logger.info("Deleted chapter with id: {}", id);
        return true;
    }

    @Override
    @Transactional
    public void incrementViewCount(String id) {
        logger.debug("Incrementing view count for chapter {}", id);
        ChapterEntity entity = chapterRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Chapter not found with id: {}", id);
            return;
        }

        entity.incrementViewCount();
        chapterRepository.save(entity);
    }
}