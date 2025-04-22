package shadowshift.studio.imagestorage.service.manga;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shadowshift.studio.imagestorage.entity.manga.MangaEntity;
import shadowshift.studio.imagestorage.mapper.manga.MangaMapper;
import shadowshift.studio.imagestorage.model.manga.Manga;
import shadowshift.studio.imagestorage.repository.manga.ChapterRepository;
import shadowshift.studio.imagestorage.repository.manga.MangaRepository;
import shadowshift.studio.imagestorage.repository.manga.PageRepository;
import shadowshift.studio.imagestorage.repository.manga.VolumeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MangaServiceImpl implements MangaService {

    private static final Logger logger = LoggerFactory.getLogger(MangaServiceImpl.class);
    
    private final MangaRepository mangaRepository;
    private final VolumeRepository volumeRepository;
    private final ChapterRepository chapterRepository;
    private final PageRepository pageRepository;
    private final MangaMapper mangaMapper;

    public MangaServiceImpl(MangaRepository mangaRepository, 
                            VolumeRepository volumeRepository,
                            ChapterRepository chapterRepository,
                            PageRepository pageRepository,
                            MangaMapper mangaMapper) {
        this.mangaRepository = mangaRepository;
        this.volumeRepository = volumeRepository;
        this.chapterRepository = chapterRepository;
        this.pageRepository = pageRepository;
        this.mangaMapper = mangaMapper;
    }

    @Override
    @Transactional
    public Manga createManga(Manga manga) {
        logger.info("Creating new manga: {}", manga.getTitle());
        MangaEntity entity = mangaMapper.toEntity(manga);
        MangaEntity savedEntity = mangaRepository.save(entity);
        return mangaMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public Manga updateManga(String id, Manga manga) {
        logger.info("Updating manga with id: {}", id);
        MangaEntity existingEntity = mangaRepository.findById(id).orElse(null);
        if (existingEntity == null) {
            logger.warn("Manga not found with id: {}", id);
            return null;
        }

        MangaEntity updatedEntity = mangaMapper.toEntity(manga, existingEntity);
        MangaEntity savedEntity = mangaRepository.save(updatedEntity);
        return mangaMapper.toModel(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Manga getManga(String id, boolean includeVolumes) {
        logger.info("Getting manga with id: {}, includeVolumes: {}", id, includeVolumes);
        MangaEntity entity = mangaRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Manga not found with id: {}", id);
            return null;
        }
        
        Manga manga = mangaMapper.toModel(entity, includeVolumes);
        
        // Add statistics if volumes are not included
        if (!includeVolumes) {
            manga.setVolumeCount((int) volumeRepository.countByMangaId(id));
            manga.setChapterCount((int) chapterRepository.findAllByMangaIdOrdered(id).size());
            manga.setPageCount((int) pageRepository.countByMangaId(id));
        }
        
        return manga;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Manga> getAllMangas(Pageable pageable) {
        logger.info("Getting all mangas, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<MangaEntity> entityPage = mangaRepository.findAll(pageable);
        return entityPage.map(mangaMapper::toModel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Manga> getMangasByUserId(String userId) {
        logger.info("Getting mangas for user: {}", userId);
        List<MangaEntity> entities = mangaRepository.findByUserId(userId);
        return entities.stream()
                .map(mangaMapper::toModel)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deleteManga(String id) {
        logger.info("Deleting manga with id: {}", id);
        if (!mangaRepository.existsById(id)) {
            logger.warn("Manga not found with id: {}", id);
            return false;
        }
        
        mangaRepository.deleteById(id);
        logger.info("Deleted manga with id: {}", id);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Manga> searchMangasByTitle(String title, Pageable pageable) {
        logger.info("Searching mangas by title: {}", title);
        Page<MangaEntity> entityPage = mangaRepository.findByTitleContainingIgnoreCase(title, pageable);
        return entityPage.map(mangaMapper::toModel);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Manga> filterMangasByGenre(String genre, Pageable pageable) {
        logger.info("Filtering mangas by genre: {}", genre);
        Page<MangaEntity> entityPage = mangaRepository.findByGenresContainingIgnoreCase(genre, pageable);
        return entityPage.map(mangaMapper::toModel);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Manga> getPublishedMangas(Pageable pageable) {
        logger.info("Getting published mangas");
        Page<MangaEntity> entityPage = mangaRepository.findByIsPublishedTrue(pageable);
        return entityPage.map(mangaMapper::toModel);
    }

    @Override
    @Transactional
    public Manga setMangaPreviewImage(String id, String imageId) {
        logger.info("Setting preview image {} for manga {}", imageId, id);
        MangaEntity entity = mangaRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Manga not found with id: {}", id);
            return null;
        }

        entity.setPreviewImageId(imageId);
        MangaEntity savedEntity = mangaRepository.save(entity);
        return mangaMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public void incrementViewCount(String id) {
        logger.debug("Incrementing view count for manga {}", id);
        MangaEntity entity = mangaRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Manga not found with id: {}", id);
            return;
        }

        entity.incrementViewCount();
        mangaRepository.save(entity);
    }
}