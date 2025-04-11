package com.shadowshiftstudio.compressionservice.controller;

import com.shadowshiftstudio.compressionservice.entity.ImageStatisticsEntity;
import com.shadowshiftstudio.compressionservice.model.Image;
import com.shadowshiftstudio.compressionservice.service.CompressionService;
import com.shadowshiftstudio.compressionservice.service.ImageStatisticsService;
import com.shadowshiftstudio.compressionservice.service.ImageStorageService;
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
import java.util.stream.Collectors;

@Controller
public class WebController {

    private final ImageStorageService imageStorageService;
    private final CompressionService compressionService;
    private final ImageStatisticsService statisticsService;

    @Autowired
    public WebController(ImageStorageService imageStorageService, CompressionService compressionService, ImageStatisticsService statisticsService) {
        this.imageStorageService = imageStorageService;
        this.compressionService = compressionService;
        this.statisticsService = statisticsService;
    }

    @GetMapping("/")
    public String home(Model model, 
                      @RequestParam(required = false) String search,
                      @RequestParam(required = false) String sortBy,
                      @RequestParam(required = false) String dateFilter,
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
        
        if ("popularity".equals(sortBy)) {
            List<ImageStatisticsEntity> popularImages = statisticsService.getMostPopularImages();
            
            List<String> orderedIds = popularImages.stream()
                .map(ImageStatisticsEntity::getImageId)
                .collect(Collectors.toList());
            
            sortedImagesMap = new LinkedHashMap<>();
            
            for (String id : orderedIds) {
                if (filteredImagesMap.containsKey(id)) {
                    sortedImagesMap.put(id, filteredImagesMap.get(id));
                    filteredImagesMap.remove(id);
                }
            }
            
            Comparator<String> dateComparator = Comparator.<String>comparingLong(id -> {
                Image img = filteredImagesMap.get(id);
                return img != null && img.getUploadedAt() != null ? 
                       -img.getUploadedAt().toEpochSecond(java.time.ZoneOffset.UTC) : 0;
            });
            
            filteredImagesMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(dateComparator))
                .forEach(entry -> sortedImagesMap.put(entry.getKey(), entry.getValue()));
        }
        else if ("size_asc".equals(sortBy)) {
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
            sortedImagesMap = new TreeMap<>(
                Comparator.<String>comparingLong(id -> {
                    Image img = filteredImagesMap.get(id);
                    return img != null && img.getUploadedAt() != null ? 
                           -img.getUploadedAt().toEpochSecond(java.time.ZoneOffset.UTC) : 0;
                })
            );
            sortedImagesMap.putAll(filteredImagesMap);
        }
        
        model.addAttribute("images", sortedImagesMap);
        model.addAttribute("search", search);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("dateFilter", dateFilter);
        model.addAttribute("sizeFilter", sizeFilter);
        
        return "index";
    }

    @PostMapping("/upload")
    public String uploadImage(@RequestParam("file") MultipartFile file, 
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
    
    @GetMapping("/images/{id}/view")
    public String viewImage(@PathVariable String id, Model model) {
        Image image = imageStorageService.getImageMetadata(id);
        if (image == null) {
            return "redirect:/";
        }
        
        statisticsService.incrementViewCount(id);
        
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
        
        return "view";
    }
    
    @PostMapping("/images/{id}/compress")
    public String compressImage(@PathVariable String id, 
                              @RequestParam(defaultValue = "5") int compressionLevel,
                              RedirectAttributes redirectAttributes) {
        try {
            if (compressionLevel < 0 || compressionLevel > 10) {
                redirectAttributes.addFlashAttribute("message", "Уровень сжатия должен быть от 0 до 10");
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
    
    /**
     * Удаление изображения
     */
    @PostMapping("/images/{id}/delete")
    public String deleteImage(@PathVariable String id, RedirectAttributes redirectAttributes) {
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