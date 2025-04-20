package shadowshift.studio.imagestorage.service.manga;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import shadowshift.studio.imagestorage.entity.manga.ChapterEntity;
import shadowshift.studio.imagestorage.entity.manga.PageEntity;
import shadowshift.studio.imagestorage.mapper.manga.PageMapper;
import shadowshift.studio.imagestorage.model.Image;
import shadowshift.studio.imagestorage.model.manga.Page;
import shadowshift.studio.imagestorage.repository.manga.ChapterRepository;
import shadowshift.studio.imagestorage.repository.manga.PageRepository;
import shadowshift.studio.imagestorage.service.ImageStorageService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PageServiceImpl implements PageService {

    private static final Logger logger = LoggerFactory.getLogger(PageServiceImpl.class);
    
    private final ChapterRepository chapterRepository;
    private final PageRepository pageRepository;
    private final PageMapper pageMapper;
    private final ImageStorageService imageStorageService;

    public PageServiceImpl(ChapterRepository chapterRepository, 
                          PageRepository pageRepository,
                          PageMapper pageMapper,
                          ImageStorageService imageStorageService) {
        this.chapterRepository = chapterRepository;
        this.pageRepository = pageRepository;
        this.pageMapper = pageMapper;
        this.imageStorageService = imageStorageService;
    }

    @Override
    @Transactional
    public Page createPage(String chapterId, Page page) {
        logger.info("Creating new page for chapter {}: page {}", chapterId, page.getPageNumber());
        ChapterEntity chapterEntity = chapterRepository.findById(chapterId).orElse(null);
        if (chapterEntity == null) {
            logger.warn("Cannot create page: chapter not found with id: {}", chapterId);
            return null;
        }
        
        PageEntity entity = pageMapper.toEntity(page);
        entity.setChapter(chapterEntity);
        
        // Set page number automatically if not provided
        if (entity.getPageNumber() <= 0) {
            long pageCount = pageRepository.countByChapterId(chapterId);
            entity.setPageNumber((int) pageCount + 1);
        }
        
        PageEntity savedEntity = pageRepository.save(entity);
        return pageMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public Page uploadPage(String chapterId, int pageNumber, MultipartFile file, String userId) throws IOException {
        logger.info("Uploading new page for chapter {}: page {}", chapterId, pageNumber);
        ChapterEntity chapterEntity = chapterRepository.findById(chapterId).orElse(null);
        if (chapterEntity == null) {
            logger.warn("Cannot upload page: chapter not found with id: {}", chapterId);
            throw new IOException("Chapter not found with id: " + chapterId);
        }
        
        // Upload the image using the existing image storage service
        Image uploadedImage = imageStorageService.storeImage(file, null, null, userId);
        
        // Create a page entity and link it to the uploaded image
        PageEntity pageEntity = new PageEntity();
        pageEntity.setChapter(chapterEntity);
        
        // Set page number or get the next available number
        if (pageNumber > 0) {
            pageEntity.setPageNumber(pageNumber);
        } else {
            long pageCount = pageRepository.countByChapterId(chapterId);
            pageEntity.setPageNumber((int) pageCount + 1);
        }
        
        pageEntity.setImageId(uploadedImage.getId());
        PageEntity savedEntity = pageRepository.save(pageEntity);
        
        logger.info("Uploaded and created page entity: {} with image: {}", 
                    savedEntity.getId(), uploadedImage.getId());
        
        return pageMapper.toModel(savedEntity);
    }

    @Override
    @Transactional
    public Page updatePage(String id, Page page) {
        logger.info("Updating page with id: {}", id);
        PageEntity existingEntity = pageRepository.findById(id).orElse(null);
        if (existingEntity == null) {
            logger.warn("Page not found with id: {}", id);
            return null;
        }

        PageEntity updatedEntity = pageMapper.toEntity(page, existingEntity);
        PageEntity savedEntity = pageRepository.save(updatedEntity);
        return pageMapper.toModel(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page getPage(String id) {
        logger.info("Getting page with id: {}", id);
        PageEntity entity = pageRepository.findById(id).orElse(null);
        if (entity == null) {
            logger.warn("Page not found with id: {}", id);
            return null;
        }
        
        return pageMapper.toModel(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Page> getPagesByChapterId(String chapterId) {
        logger.info("Getting pages for chapter: {}", chapterId);
        List<PageEntity> entities = pageRepository.findByChapterIdOrderByPageNumberAsc(chapterId);
        return entities.stream()
                .map(pageMapper::toModel)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deletePage(String id) {
        logger.info("Deleting page with id: {}", id);
        PageEntity pageEntity = pageRepository.findById(id).orElse(null);
        if (pageEntity == null) {
            logger.warn("Page not found with id: {}", id);
            return false;
        }
        
        // Note: We're not deleting the associated image, as it might be used elsewhere
        // or kept for historical reasons. The image will be automatically detected
        // as orphaned by any cleanup process if needed.
        
        pageRepository.deleteById(id);
        logger.info("Deleted page with id: {}", id);
        return true;
    }

    @Override
    @Transactional
    public List<Page> reorderPages(String chapterId, List<String> pageIds) {
        logger.info("Reordering {} pages for chapter: {}", pageIds.size(), chapterId);
        
        List<PageEntity> updatedEntities = new ArrayList<>();
        int pageNumber = 1;
        
        for (String pageId : pageIds) {
            PageEntity entity = pageRepository.findById(pageId).orElse(null);
            
            if (entity != null && entity.getChapter() != null && 
                entity.getChapter().getId().equals(chapterId)) {
                
                entity.setPageNumber(pageNumber++);
                updatedEntities.add(pageRepository.save(entity));
            } else {
                logger.warn("Ignoring invalid page id in reorder operation: {}", pageId);
            }
        }
        
        // Return the updated pages
        return updatedEntities.stream()
                .map(pageMapper::toModel)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page findPageByImageId(String imageId) {
        logger.info("Finding page by image id: {}", imageId);
        Optional<PageEntity> entityOpt = pageRepository.findByImageId(imageId);
        return entityOpt.map(pageMapper::toModel).orElse(null);
    }
}