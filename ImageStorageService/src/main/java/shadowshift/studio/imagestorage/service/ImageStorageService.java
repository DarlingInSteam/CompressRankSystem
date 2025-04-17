package shadowshift.studio.imagestorage.service;

import org.springframework.web.multipart.MultipartFile;
import shadowshift.studio.imagestorage.model.Image;
import shadowshift.studio.imagestorage.model.UserInfo;

import java.io.IOException;
import java.util.Map;

public interface ImageStorageService {

    /**
     * Saves an image to storage
     * 
     * @param file uploaded file
     * @param userInfo information about the user uploading the image
     * @return image metadata object
     * @throws IOException if file operation fails
     */
    Image storeImage(MultipartFile file, UserInfo userInfo) throws IOException;

    /**
     * Overloaded method for backward compatibility
     * 
     * @param file uploaded file
     * @return image metadata object
     * @throws IOException if file operation fails
     */
    default Image storeImage(MultipartFile file) throws IOException {
        return storeImage(file, null);
    }

    /**
     * Saves a compressed image to storage
     * 
     * @param imageId original image ID
     * @param compressedData compressed image binary data
     * @param compressionLevel compression level applied to the image
     * @return updated image metadata object
     * @throws IOException if file operation fails
     */
    Image storeCompressedImage(String imageId, byte[] compressedData, int compressionLevel) throws IOException;

    /**
     * Updates an existing image with new compression level
     * 
     * @param imageId image ID to update
     * @param imageData updated image binary data
     * @param compressionLevel new compression level
     * @return updated image metadata object
     * @throws IOException if file operation fails
     */
    Image updateImageCompression(String imageId, byte[] imageData, int compressionLevel) throws IOException;

    /**
     * Gets image data by ID
     * 
     * @param id image ID
     * @return binary image data
     * @throws IOException if file operation fails
     */
    byte[] getImage(String id) throws IOException;
    
    /**
     * Gets the original backup of an image
     * If the image was never compressed, returns current data
     * 
     * @param id image ID
     * @return binary data of original image or null if backup not found
     * @throws IOException if file operation fails
     */
    byte[] getOriginalImageBackup(String id) throws IOException;
    
    /**
     * Gets image metadata by ID
     * 
     * @param id image ID
     * @return image metadata object or null if not found
     */
    Image getImageMetadata(String id);
    
    /**
     * Gets metadata for all images
     * 
     * @return map where key is image ID and value is image metadata
     */
    Map<String, Image> getAllImageMetadata();
    
    /**
     * Deletes an image from storage by ID
     * 
     * @param id image ID
     * @return true if image successfully deleted, false otherwise
     * @throws IOException if file operation fails
     */
    boolean deleteImage(String id) throws IOException;
}