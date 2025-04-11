package com.shadowshiftstudio.compressionservice.service;

import com.shadowshiftstudio.compressionservice.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import jakarta.annotation.PostConstruct;

public interface ImageStorageService {

    /**
     * Сохраняет изображение в хранилище
     * 
     * @param file загруженный файл
     * @return объект с метаданными изображения
     * @throws IOException в случае ошибки работы с файлами
     */
    Image storeImage(MultipartFile file) throws IOException;

    /**
     * Сохраняет сжатое изображение в хранилище
     * 
     * @param imageId идентификатор оригинального изображения
     * @param compressedData двоичные данные сжатого изображения
     * @param compressionLevel уровень сжатия, применённый к изображению
     * @return объект с обновлёнными метаданными изображения
     * @throws IOException в случае ошибки работы с файлами
     */
    Image storeCompressedImage(String imageId, byte[] compressedData, int compressionLevel) throws IOException;

    /**
     * Получает данные изображения по ID
     * 
     * @param id идентификатор изображения
     * @return двоичные данные изображения
     * @throws IOException в случае ошибки работы с файлами
     */
    byte[] getImage(String id) throws IOException;
    
    /**
     * Получает метаданные изображения по ID
     * 
     * @param id идентификатор изображения
     * @return объект с метаданными изображения или null, если изображение не найдено
     */
    Image getImageMetadata(String id);
    
    /**
     * Получает метаданные всех изображений
     * 
     * @return карта, где ключ - ID изображения, значение - объект с метаданными
     */
    Map<String, Image> getAllImageMetadata();
    
    /**
     * Удаляет изображение из хранилища по ID
     * 
     * @param id идентификатор изображения
     * @return true, если изображение успешно удалено, иначе false
     * @throws IOException в случае ошибки работы с файлами
     */
    boolean deleteImage(String id) throws IOException;
}