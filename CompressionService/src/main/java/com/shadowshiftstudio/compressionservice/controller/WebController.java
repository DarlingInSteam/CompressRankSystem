package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.compression.CompressionService;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
import com.shadowshiftstudio.compressionservice.service.future.StatisticsIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.*;

@Controller
@Tag(name = "Веб-интерфейс", description = "Контроллер для работы с HTML-страницами веб-интерфейса")
public class WebController {

    private static final Logger logger = LoggerFactory.getLogger(WebController.class);
    
    private final ImageStorageService imageStorageService;
    private final CompressionService compressionService;
    private final StatisticsIntegrationService statisticsService;

    @Autowired
    public WebController(ImageStorageService imageStorageService, CompressionService compressionService, 
                        StatisticsIntegrationService statisticsService) {
        this.imageStorageService = imageStorageService;
        this.compressionService = compressionService;
        this.statisticsService = statisticsService;
    }

    @Operation(
        summary = "Главная страница",
        description = "Отображает главную страницу с галереей всех исходных изображений, с возможностью фильтрации и сортировки"
    )
    @GetMapping("/")
    public String home(
            Model model,
            @Parameter(description = "Поисковый запрос для фильтрации изображений по имени") 
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Способ сортировки изображений (size_asc, size_desc)") 
            @RequestParam(required = false) String sortBy,
            
            @Parameter(description = "Фильтр по дате загрузки (today, week, month, year)") 
            @RequestParam(required = false) String dateFilter,
            
            @Parameter(description = "Фильтр по размеру (small, medium, large, xlarge)") 
            @RequestParam(required = false) String sizeFilter) {
        
        Map<String, Image> imagesMap = imageStorageService.getAllImageMetadata();
        Map<String, Image> filteredImagesMap = new HashMap<>(imagesMap);
        
        filteredImagesMap.entrySet().removeIf(entry -> entry.getValue().getOriginalImageId() != null);
        
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            filteredImagesMap.entrySet().removeIf(entry -> 
                !entry.getValue().getOriginalFilename().toLowerCase().contains(searchLower));
        }
        
        if (dateFilter != null && !dateFilter.isEmpty()) {
            LocalDateTime filterDate = null;
            
            switch (dateFilter) {
                case "today":
                    filterDate = LocalDateTime.now().minusDays(1);
                    break;
                case "week":
                    filterDate = LocalDateTime.now().minusWeeks(1);
                    break;
                case "month":
                    filterDate = LocalDateTime.now().minusMonths(1);
                    break;
                case "year":
                    filterDate = LocalDateTime.now().minusYears(1);
                    break;
            }
            
            if (filterDate != null) {
                LocalDateTime finalFilterDate = filterDate;
                filteredImagesMap.entrySet().removeIf(entry -> 
                    entry.getValue().getUploadedAt().isBefore(finalFilterDate));
            }
        }
        
        if (sizeFilter != null && !sizeFilter.isEmpty()) {
            long minSize = 0;
            long maxSize = Long.MAX_VALUE;
            
            switch (sizeFilter) {
                case "small":
                    maxSize = 100 * 1024;
                    break;
                case "medium":
                    minSize = 100 * 1024;
                    maxSize = 1024 * 1024;
                    break;
                case "large":
                    minSize = 1024 * 1024;
                    maxSize = 5 * 1024 * 1024;
                    break;
                case "xlarge":
                    minSize = 5 * 1024 * 1024;
                    break;
            }
            
            long finalMinSize = minSize;
            long finalMaxSize = maxSize;
            filteredImagesMap.entrySet().removeIf(entry -> {
                long size = entry.getValue().getSize();
                return size < finalMinSize || size > finalMaxSize;
            });
        }
        
        Map<String, Image> sortedImagesMap;
        
        if ("size_asc".equals(sortBy)) {
            sortedImagesMap = new TreeMap<>(
                Comparator.<String>comparingLong(id -> {
                    Image img = filteredImagesMap.get(id);
                    return img != null ? img.getSize() : 0;
                })
            );
            sortedImagesMap.putAll(filteredImagesMap);
        }
        else if ("size_desc".equals(sortBy)) {
            sortedImagesMap = new TreeMap<>(
                Comparator.<String>comparingLong(id -> {
                    Image img = filteredImagesMap.get(id);
                    return img != null ? -img.getSize() : 0;
                })
            );
            sortedImagesMap.putAll(filteredImagesMap);
        }
        else {
            // Сортировка по дате загрузки (от новых к старым) по умолчанию
            sortedImagesMap = new TreeMap<>(
                Comparator.<String>comparingLong(id -> {
                    Image img = filteredImagesMap.get(id);
                    return img != null && img.getUploadedAt() != null ? 
                           -img.getUploadedAt().toEpochSecond(java.time.ZoneOffset.UTC) : 0;
                })
            );
            sortedImagesMap.putAll(filteredImagesMap);
        }
        
        // Примечание: статистические сортировки (views, downloads, popularity) 
        // теперь обрабатываются в микросервисе статистики
        logger.debug("Отображение главной страницы. Статистические данные теперь доступны через микросервис StatisticsRankingService.");
        
        model.addAttribute("images", sortedImagesMap);
        model.addAttribute("statisticsNote", "Статистика доступна через сервис StatisticsRankingService");
        model.addAttribute("search", search);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("dateFilter", dateFilter);
        model.addAttribute("sizeFilter", sizeFilter);
        
        return "index";
    }

    @Operation(
        summary = "Загрузка изображения через форму",
        description = "Обрабатывает загрузку нового изображения через веб-форму"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "302", description = "Редирект на главную страницу после загрузки")
    })
    @PostMapping("/upload")
    public String uploadImage(
            @Parameter(description = "Файл изображения для загрузки", required = true)
            @RequestParam("file") MultipartFile file, 
            RedirectAttributes redirectAttributes) {
        try {
            if (file.isEmpty()) {
                redirectAttributes.addFlashAttribute("message", "Пожалуйста, выберите файл для загрузки");
                return "redirect:/";
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                redirectAttributes.addFlashAttribute("message", "Поддерживаются только изображения");
                return "redirect:/";
            }

            Image image = imageStorageService.storeImage(file);
            redirectAttributes.addFlashAttribute("message", 
                "Изображение успешно загружено: " + file.getOriginalFilename());
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", 
                "Произошла ошибка при загрузке изображения: " + e.getMessage());
        }
        
        return "redirect:/";
    }
    
    @Operation(
        summary = "Страница просмотра изображения",
        description = "Отображает страницу с детальной информацией о изображении и его сжатых версиях"
    )
    @GetMapping("/images/{id}/view")
    public String viewImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String id, 
            Model model) {
        Image image = imageStorageService.getImageMetadata(id);
        if (image == null) {
            return "redirect:/";
        }
        
        // Примечание: учет просмотров изображений теперь проводится в микросервисе статистики
        logger.debug("Просмотр изображения {}. Учет статистики просмотров производится в микросервисе StatisticsRankingService.", id);
        
        model.addAttribute("image", image);
        
        Map<String, Image> allImages = imageStorageService.getAllImageMetadata();
        Map<String, Image> compressedVersions = new TreeMap<>();
        
        for (Map.Entry<String, Image> entry : allImages.entrySet()) {
            Image img = entry.getValue();
            if (id.equals(img.getOriginalImageId())) {
                compressedVersions.put(entry.getKey(), img);
            }
        }
        
        model.addAttribute("compressedVersions", compressedVersions);
        model.addAttribute("statisticsMessage", statisticsService.getStatisticsStatus());
        
        return "view";
    }
    
    @Operation(
        summary = "Сжатие изображения через форму",
        description = "Обрабатывает запрос на сжатие изображения с указанным уровнем компрессии"
    )
    @PostMapping("/images/{id}/compress")
    public String compressImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String id, 
            
            @Parameter(description = "Уровень сжатия от 0 до 100", example = "50")
            @RequestParam(defaultValue = "50") int compressionLevel,
            
            RedirectAttributes redirectAttributes) {
        try {
            if (compressionLevel < 0 || compressionLevel > 100) {
                redirectAttributes.addFlashAttribute("message", "Уровень сжатия должен быть от 0 до 100");
                return "redirect:/images/" + id + "/view";
            }
            
            Image compressedImage = compressionService.compressImage(id, compressionLevel);
            redirectAttributes.addFlashAttribute("message", 
                "Изображение успешно сжато (уровень: " + compressionLevel + ")");
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", 
                "Произошла ошибка при сжатии изображения: " + e.getMessage());
        }
        
        return "redirect:/images/" + id + "/view";
    }
    
    @Operation(
        summary = "Восстановление изображения через форму",
        description = "Обрабатывает запрос на восстановление изображения до исходного качества"
    )
    @PostMapping("/images/{id}/restore")
    public String restoreImage(
            @Parameter(description = "Идентификатор изображения", required = true)
            @PathVariable String id,
            
            RedirectAttributes redirectAttributes) {
        try {
            Image restoredImage = compressionService.restoreImage(id);
            redirectAttributes.addFlashAttribute("message", 
                "Изображение успешно восстановлено до исходного качества");
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", 
                "Произошла ошибка при восстановлении изображения: " + e.getMessage());
        }
        
        return "redirect:/images/" + id + "/view";
    }
    
    @Operation(
        summary = "Удаление изображения через форму",
        description = "Обрабатывает запрос на удаление изображения"
    )
    @PostMapping("/images/{id}/delete")
    public String deleteImage(
            @Parameter(description = "Идентификатор изображения для удаления", required = true)
            @PathVariable String id, 
            RedirectAttributes redirectAttributes) {
        try {
            Image image = imageStorageService.getImageMetadata(id);
            if (image == null) {
                redirectAttributes.addFlashAttribute("message", "Изображение не найдено");
                return "redirect:/";
            }
            
            String fileName = image.getOriginalFilename();
            
            boolean result = imageStorageService.deleteImage(id);
            
            if (result) {
                redirectAttributes.addFlashAttribute("message", "Изображение успешно удалено: " + fileName);
            } else {
                redirectAttributes.addFlashAttribute("message", "Не удалось удалить изображение");
            }
            
            if (image.getOriginalImageId() != null) {
                return "redirect:/images/" + image.getOriginalImageId() + "/view";
            }
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", 
                "Произошла ошибка при удалении изображения: " + e.getMessage());
        }
        
        return "redirect:/";
    }
}