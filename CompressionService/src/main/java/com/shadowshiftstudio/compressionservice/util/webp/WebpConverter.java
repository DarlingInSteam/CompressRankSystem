package com.shadowshiftstudio.compressionservice.util.webp;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;

/**
 * Utility for converting images to WebP format using cwebp command line tool.
 * Input format can be either PNG, JPEG, TIFF, WebP or raw Y'CbCr samples.
 * Note: Animated PNG and WebP files are not supported by cwebp but this class detects them.
 */
public class WebpConverter {
    private static final Logger logger = Logger.getLogger(WebpConverter.class.getName());
    
    // Common image formats supported by cwebp
    private static final Set<String> SUPPORTED_FORMATS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "tiff", "tif", "webp"));
            
    /**
     * Converting image to WebP Byte with default quality (75)
     * @param imageByte input image byte array
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageToWebpByte(byte[] imageByte) throws CWebpException {
        return imageToWebpByte(imageByte, 75);
    }

    /**
     * Converting image to WebP Byte with specified quality
     * @param imageByte input image byte array
     * @param quality compression factor for RGB channels (0-100)
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageToWebpByte(byte[] imageByte, int quality) throws CWebpException {
        if (imageByte == null || imageByte.length == 0) {
            throw new CWebpException("Input image byte array is empty or null");
        }

        try {
            CWebp cwebp = new CWebp().quality(quality);
            return cwebp.convertFromBytes(imageByte);
        } catch (IOException e) {
            throw new CWebpException("Error processing image: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converting image to WebP Byte with advanced options
     * 
     * @param imageByte input image byte array
     * @param options WebP options to customize the conversion
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageToWebpByte(byte[] imageByte, WebpOptions options) throws CWebpException {
        if (imageByte == null || imageByte.length == 0) {
            throw new CWebpException("Input image byte array is empty or null");
        }
        
        try {
            CWebp cwebp = new CWebp();
            
            // Apply all options
            if (options.isLossless()) {
                cwebp.lossless();
            } else {
                cwebp.quality(options.getQuality());
            }
            
            // Alpha quality
            if (options.getAlphaQuality() > 0) {
                cwebp.alphaQ(options.getAlphaQuality());
            }
            
            // Resize if specified
            if (options.getWidth() > 0 && options.getHeight() > 0) {
                cwebp.resize(options.getWidth(), options.getHeight());
            }
            
            // Apply crop if specified
            if (options.getCropWidth() > 0 && options.getCropHeight() > 0) {
                cwebp.crop(options.getCropX(), options.getCropY(), options.getCropWidth(), options.getCropHeight());
            }
            
            // Apply noise filtering
            if (options.getNoiseFilter() > 0) {
                cwebp.strongNoise(options.getNoiseFilter());
            }
            
            // Apply sharpness
            if (options.getSharpness() > 0) {
                cwebp.sharpness(options.getSharpness());
            }
            
            // Use low memory if requested
            if (options.isLowMemory()) {
                cwebp.lowMemory();
            }
            
            // Set exact option if needed
            if (options.isExact()) {
                cwebp.exact();
            }
            
            // Perform direct in-memory conversion
            return cwebp.convertFromBytes(imageByte);
        } catch (IOException e) {
            throw new CWebpException("Error processing image: " + e.getMessage(), e);
        }
    }

    /**
     * Converting image file to WebP byte array
     * @param imageFilePath input image file path
     * @param quality compression factor for RGB channels (0-100)
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageFileToWebpByte(String imageFilePath, int quality) throws CWebpException {
        if (imageFilePath == null || imageFilePath.trim().isEmpty()) {
            throw new CWebpException("Image file path is empty or null");
        }
        
        File imageFile = new File(imageFilePath);
        if (!imageFile.exists() || !imageFile.isFile()) {
            throw new CWebpException("Image file does not exist: " + imageFilePath);
        }

        // Validate image format
        String extension = FilenameUtils.getExtension(imageFilePath).toLowerCase();
        if (!SUPPORTED_FORMATS.contains(extension)) {
            logger.warning("File extension '" + extension + "' may not be supported by cwebp");
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("webp_" + generateUniqueId());
            String output = tempDir.toString() + "/img_" + generateUniqueId() + ".webp";

            return getWebpBytes(imageFilePath, quality, tempDir, output);
        } catch (IOException e) {
            throw new CWebpException("Error processing image file: " + e.getMessage(), e);
        } finally {
            cleanupTempDir(tempDir);
        }
    }

    /**
     * Converting image file to WebP byte array with advanced options
     * @param imageFilePath input image file path
     * @param options WebP options to customize the conversion
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageFileToWebpByte(String imageFilePath, WebpOptions options) throws CWebpException {
        if (imageFilePath == null || imageFilePath.trim().isEmpty()) {
            throw new CWebpException("Image file path is empty or null");
        }
        
        File imageFile = new File(imageFilePath);
        if (!imageFile.exists() || !imageFile.isFile()) {
            throw new CWebpException("Image file does not exist: " + imageFilePath);
        }

        // Validate image format
        String extension = FilenameUtils.getExtension(imageFilePath).toLowerCase();
        if (!SUPPORTED_FORMATS.contains(extension)) {
            logger.warning("File extension '" + extension + "' may not be supported by cwebp");
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("webp_" + generateUniqueId());
            String output = tempDir.toString() + "/img_" + generateUniqueId() + ".webp";

            return getWebpBytesWithOptions(imageFilePath, options, tempDir, output);
        } catch (IOException e) {
            throw new CWebpException("Error processing image file: " + e.getMessage(), e);
        } finally {
            cleanupTempDir(tempDir);
        }
    }

    /**
     * Converting image file to WebP byte array
     * @param imageFile input image file
     * @param quality compression factor for RGB channels
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageFileToWebpByte(File imageFile, int quality) throws CWebpException {
        if (imageFile == null) {
            throw new CWebpException("Image file is null");
        }
        return imageFileToWebpByte(imageFile.getAbsolutePath(), quality);
    }
    
    /**
     * Converting image file to WebP byte array with advanced options
     * @param imageFile input image file
     * @param options WebP options to customize the conversion
     * @return WebP image byte array
     * @throws CWebpException if conversion fails
     */
    public static byte[] imageFileToWebpByte(File imageFile, WebpOptions options) throws CWebpException {
        if (imageFile == null) {
            throw new CWebpException("Image file is null");
        }
        return imageFileToWebpByte(imageFile.getAbsolutePath(), options);
    }

    /**
     * Converting image byte array to WebP File with default quality (75)
     * @param imageByte input image byte array
     * @param webpPathFile output webp image path file
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageToWebpFile(byte[] imageByte, String webpPathFile) throws CWebpException {
        return imageToWebpFile(imageByte, webpPathFile, 75);
    }

    /**
     * Converting image byte array to WebP File with specified quality
     * @param imageByte input image byte array
     * @param webpPathFile output webp image path file
     * @param quality compression factor for RGB channels
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageToWebpFile(byte[] imageByte, String webpPathFile, int quality) throws CWebpException {
        if (imageByte == null || imageByte.length == 0) {
            throw new CWebpException("Input image byte array is empty or null");
        }
        
        if (webpPathFile == null || webpPathFile.trim().isEmpty()) {
            throw new CWebpException("Output webp file path is empty or null");
        }
        
        try {
            // Convert byte array directly to WebP bytes
            byte[] webpData = imageToWebpByte(imageByte, quality);
            
            // Write WebP bytes to file
            try (FileOutputStream fos = new FileOutputStream(webpPathFile)) {
                fos.write(webpData);
            }
            
            return new File(webpPathFile);
        } catch (IOException e) {
            throw new CWebpException("Error processing image: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converting image byte array to WebP File with advanced options
     * @param imageByte input image byte array
     * @param webpPathFile output webp image path file
     * @param options WebP options to customize the conversion
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageToWebpFile(byte[] imageByte, String webpPathFile, WebpOptions options) throws CWebpException {
        if (imageByte == null || imageByte.length == 0) {
            throw new CWebpException("Input image byte array is empty or null");
        }
        
        if (webpPathFile == null || webpPathFile.trim().isEmpty()) {
            throw new CWebpException("Output webp file path is empty or null");
        }

        try {
            // Convert byte array directly to WebP bytes with options
            byte[] webpData = imageToWebpByte(imageByte, options);
            
            // Write WebP bytes to file
            try (FileOutputStream fos = new FileOutputStream(webpPathFile)) {
                fos.write(webpData);
            }
            
            return new File(webpPathFile);
        } catch (IOException e) {
            throw new CWebpException("Error processing image: " + e.getMessage(), e);
        }
    }

    /**
     * Converting image file to WebP File with specified quality
     * @param imageFilePath input image file path
     * @param webpPathFile output webp image path file
     * @param quality compression factor for RGB channels
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageFileToWebpFile(String imageFilePath, String webpPathFile, int quality) throws CWebpException {
        if (imageFilePath == null || imageFilePath.trim().isEmpty()) {
            throw new CWebpException("Image file path is empty or null");
        }
        
        if (webpPathFile == null || webpPathFile.trim().isEmpty()) {
            throw new CWebpException("Output webp file path is empty or null");
        }
        
        File imageFile = new File(imageFilePath);
        if (!imageFile.exists() || !imageFile.isFile()) {
            throw new CWebpException("Image file does not exist: " + imageFilePath);
        }

        try {
            return getWebpFile(imageFilePath, quality, null, webpPathFile);
        } catch (IOException e) {
            throw new CWebpException("Error processing image file: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converting image file to WebP File with advanced options
     * @param imageFilePath input image file path
     * @param webpPathFile output webp image path file
     * @param options WebP options to customize the conversion
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageFileToWebpFile(String imageFilePath, String webpPathFile, WebpOptions options) throws CWebpException {
        if (imageFilePath == null || imageFilePath.trim().isEmpty()) {
            throw new CWebpException("Image file path is empty or null");
        }
        
        if (webpPathFile == null || webpPathFile.trim().isEmpty()) {
            throw new CWebpException("Output webp file path is empty or null");
        }
        
        File imageFile = new File(imageFilePath);
        if (!imageFile.exists() || !imageFile.isFile()) {
            throw new CWebpException("Image file does not exist: " + imageFilePath);
        }

        try {
            return getWebpFileWithOptions(imageFilePath, options, null, webpPathFile);
        } catch (IOException e) {
            throw new CWebpException("Error processing image file: " + e.getMessage(), e);
        }
    }

    /**
     * Converting image file to WebP File with specified quality
     * @param imageFile input image file
     * @param webpPathFile output webp image path file
     * @param quality compression factor for RGB channels
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageFileToWebpFile(File imageFile, String webpPathFile, int quality) throws CWebpException {
        if (imageFile == null) {
            throw new CWebpException("Image file is null");
        }
        return imageFileToWebpFile(imageFile.getAbsolutePath(), webpPathFile, quality);
    }
    
    /**
     * Converting image file to WebP File with advanced options
     * @param imageFile input image file
     * @param webpPathFile output webp image path file
     * @param options WebP options to customize the conversion
     * @return WebP image File
     * @throws CWebpException if conversion fails
     */
    public static File imageFileToWebpFile(File imageFile, String webpPathFile, WebpOptions options) throws CWebpException {
        if (imageFile == null) {
            throw new CWebpException("Image file is null");
        }
        return imageFileToWebpFile(imageFile.getAbsolutePath(), webpPathFile, options);
    }

    /**
     * Check if the image format is supported
     * @param imageByte image byte array to check
     * @return true if supported, false otherwise
     */
    public static boolean isSupportedFormat(byte[] imageByte) {
        if (imageByte == null || imageByte.length < 12) {
            return false;
        }
        
        try {
            String format = detectImageFormat(imageByte);
            return SUPPORTED_FORMATS.contains(format);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Batch convert multiple image files to WebP format
     * @param inputFiles array of input image files
     * @param outputDirectory directory to save WebP files
     * @param quality compression quality (0-100)
     * @return array of converted WebP files
     * @throws CWebpException if conversion fails
     */
    public static File[] batchConvertToWebp(File[] inputFiles, File outputDirectory, int quality) throws CWebpException {
        if (inputFiles == null || inputFiles.length == 0) {
            throw new CWebpException("Input files array is empty or null");
        }
        
        if (outputDirectory == null) {
            throw new CWebpException("Output directory is null");
        }
        
        if (!outputDirectory.exists()) {
            outputDirectory.mkdirs();
        }
        
        if (!outputDirectory.isDirectory()) {
            throw new CWebpException("Output path is not a directory: " + outputDirectory.getAbsolutePath());
        }
        
        File[] outputFiles = new File[inputFiles.length];
        
        for (int i = 0; i < inputFiles.length; i++) {
            if (inputFiles[i] != null && inputFiles[i].exists() && inputFiles[i].isFile()) {
                String baseName = FilenameUtils.getBaseName(inputFiles[i].getName());
                String outputPath = new File(outputDirectory, baseName + ".webp").getAbsolutePath();
                
                try {
                    outputFiles[i] = imageFileToWebpFile(inputFiles[i], outputPath, quality);
                    logger.info("Converted " + inputFiles[i].getPath() + " to " + outputPath);
                } catch (Exception e) {
                    logger.log(Level.WARNING, "Failed to convert " + inputFiles[i].getPath(), e);
                    outputFiles[i] = null;
                }
            } else {
                outputFiles[i] = null;
            }
        }
        
        return outputFiles;
    }

    /**
     * Converting image to WebP byte array
     * @param imageFilePath input image file path
     * @param quality compression factor for RGB channels
     * @param tempDir temp directory for converting
     * @param output output webp image path file
     * @return WebP image byte array
     * @throws IOException if an I/O error occurs
     * @throws CWebpException if cwebp execution fails
     */
    private static byte[] getWebpBytes(String imageFilePath, int quality, Path tempDir, String output) throws IOException, CWebpException {
        try {
            CWebp cwebp = new CWebp().quality(quality);
            
            // If we have a file path, read the bytes
            byte[] inputImageBytes = Files.readAllBytes(new File(imageFilePath).toPath());
            
            // Perform direct in-memory conversion
            return cwebp.convertFromBytes(inputImageBytes);
        } catch (IOException e) {
            throw new CWebpException("WebP conversion failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converting image to WebP byte array with advanced options
     * @param imageFilePath input image file path
     * @param options WebP options for conversion
     * @param tempDir temp directory for converting
     * @param output output webp image path file
     * @return WebP image byte array
     * @throws IOException if an I/O error occurs
     * @throws CWebpException if cwebp execution fails
     */
    private static byte[] getWebpBytesWithOptions(String imageFilePath, WebpOptions options, Path tempDir, String output) 
            throws IOException, CWebpException {
        
        CWebp cwebp = new CWebp();
        
        // Apply all options
        if (options.isLossless()) {
            cwebp.lossless();
        } else {
            cwebp.quality(options.getQuality());
        }
        
        // Alpha quality
        if (options.getAlphaQuality() > 0) {
            cwebp.alphaQ(options.getAlphaQuality());
        }
        
        // Resize if specified
        if (options.getWidth() > 0 && options.getHeight() > 0) {
            cwebp.resize(options.getWidth(), options.getHeight());
        }
        
        // Apply crop if specified
        if (options.getCropWidth() > 0 && options.getCropHeight() > 0) {
            cwebp.crop(options.getCropX(), options.getCropY(), options.getCropWidth(), options.getCropHeight());
        }
        
        // Apply noise filtering
        if (options.getNoiseFilter() > 0) {
            cwebp.strongNoise(options.getNoiseFilter());
        }
        
        // Apply sharpness
        if (options.getSharpness() > 0) {
            cwebp.sharpness(options.getSharpness());
        }
        
        // Use low memory if requested
        if (options.isLowMemory()) {
            cwebp.lowMemory();
        }
        
        // Set exact option if needed
        if (options.isExact()) {
            cwebp.exact();
        }
        
        try {
            // Read input image bytes
            byte[] inputImageBytes = Files.readAllBytes(new File(imageFilePath).toPath());
            
            // Perform direct in-memory conversion
            return cwebp.convertFromBytes(inputImageBytes);
        } catch (IOException e) {
            throw new CWebpException("WebP conversion with options failed: " + e.getMessage(), e);
        }
    }

    /**
     * Converting image to WebP File
     * @param imageFilePath input image file path
     * @param quality compression factor for RGB channels
     * @param tempDir temp directory for converting
     * @param output output webp image path file
     * @return WebP image File
     * @throws IOException if an I/O error occurs
     * @throws CWebpException if cwebp execution fails
     */
    private static File getWebpFile(String imageFilePath, int quality, Path tempDir, String output) throws IOException, CWebpException {
        try {
            // Convert the image bytes in memory
            byte[] inputBytes = Files.readAllBytes(new File(imageFilePath).toPath());
            byte[] webpData = imageToWebpByte(inputBytes, quality);
            
            // Write to output file
            try (FileOutputStream fos = new FileOutputStream(output)) {
                fos.write(webpData);
            }
            
            return new File(output);
        } catch (IOException e) {
            throw new CWebpException("Error processing image file: " + e.getMessage(), e);
        }
    }
    
    /**
     * Converting image to WebP File with advanced options
     * @param imageFilePath input image file path
     * @param options WebP options for conversion
     * @param tempDir temp directory for converting
     * @param output output webp image path file
     * @return WebP image File
     * @throws IOException if an I/O error occurs
     * @throws CWebpException if cwebp execution fails
     */
    private static File getWebpFileWithOptions(String imageFilePath, WebpOptions options, Path tempDir, String output) 
            throws IOException, CWebpException {
        
        try {
            // Read input image bytes
            byte[] inputBytes = Files.readAllBytes(new File(imageFilePath).toPath());
            
            // Convert in memory using our options
            byte[] webpData = imageToWebpByte(inputBytes, options);
            
            // Write to output file
            try (FileOutputStream fos = new FileOutputStream(output)) {
                fos.write(webpData);
            }
            
            return new File(output);
        } catch (IOException e) {
            throw new CWebpException("WebP conversion with options failed: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a unique ID for file naming
     * @return unique string ID
     */
    private static String generateUniqueId() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid;
    }
    
    /**
     * Detect image format based on magic bytes
     * @param bytes image byte array
     * @return file extension (without dot) for the detected format
     */
    private static String detectImageFormat(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return "dat";
        }
        
        // Check for PNG
        if (bytes[0] == (byte)0x89 && bytes[1] == (byte)0x50 && bytes[2] == (byte)0x4E && 
            bytes[3] == (byte)0x47 && bytes[4] == (byte)0x0D && bytes[5] == (byte)0x0A && 
            bytes[6] == (byte)0x1A && bytes[7] == (byte)0x0A) {
            return "png";
        }
        
        // Check for JPEG
        if (bytes[0] == (byte)0xFF && bytes[1] == (byte)0xD8 && bytes[2] == (byte)0xFF) {
            return "jpg";
        }
        
        // Check for GIF
        if (bytes[0] == (byte)'G' && bytes[1] == (byte)'I' && bytes[2] == (byte)'F' && 
            bytes[3] == (byte)'8' && (bytes[4] == (byte)'7' || bytes[4] == (byte)'9') && 
            bytes[5] == (byte)'a') {
            return "gif";
        }
        
        // Check for WEBP
        if (bytes.length >= 12 && bytes[8] == (byte)'W' && bytes[9] == (byte)'E' && bytes[10] == (byte)'B' && 
            bytes[11] == (byte)'P') {
            return "webp";
        }
        
        // Check for BMP
        if (bytes[0] == (byte)'B' && bytes[1] == (byte)'M') {
            return "bmp";
        }
        
        // Check for TIFF (little endian)
        if (bytes[0] == (byte)0x49 && bytes[1] == (byte)0x49 && bytes[2] == (byte)0x2A && 
            bytes[3] == (byte)0x00) {
            return "tif";
        }
        
        // Check for TIFF (big endian)
        if (bytes[0] == (byte)0x4D && bytes[1] == (byte)0x4D && bytes[2] == (byte)0x00 && 
            bytes[3] == (byte)0x2A) {
            return "tif";
        }
        
        // Try to guess based on content
        String guessedFormat = guessImageFormat(bytes);
        if (guessedFormat != null) {
            return guessedFormat;
        }
        
        // Default to binary data
        return "dat";
    }
    
    /**
     * Attempt to guess the image format if magic bytes don't match known patterns
     */
    private static String guessImageFormat(byte[] bytes) {
        // Look for JFIF marker in JPEG
        for (int i = 0; i < bytes.length - 10; i++) {
            if (bytes[i] == (byte)'J' && bytes[i+1] == (byte)'F' && bytes[i+2] == (byte)'I' && 
                bytes[i+3] == (byte)'F') {
                return "jpg";
            }
        }
        
        // Look for EXIF marker
        for (int i = 0; i < bytes.length - 10; i++) {
            if (bytes[i] == (byte)'E' && bytes[i+1] == (byte)'x' && bytes[i+2] == (byte)'i' && 
                bytes[i+3] == (byte)'f') {
                return "jpg";
            }
        }
        
        // Check if it might be a PNG (sometimes magic bytes are corrupted)
        for (int i = 0; i < bytes.length - 10; i++) {
            if (bytes[i] == (byte)'I' && bytes[i+1] == (byte)'H' && bytes[i+2] == (byte)'D' && 
                bytes[i+3] == (byte)'R') {
                return "png";
            }
        }
        
        return null;
    }
    
    /**
     * Clean up a temporary directory if it exists
     * @param tempDir directory to clean up
     */
    private static void cleanupTempDir(Path tempDir) {
        if (tempDir != null) {
            try {
                FileUtils.deleteDirectory(tempDir.toFile());
            } catch (IOException e) {
                logger.log(Level.WARNING, "Failed to delete temporary directory: " + tempDir, e);
            }
        }
    }
}
