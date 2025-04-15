package shadowshift.studio.imagestorage.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;

@Service
public class WebImageProcessor {

    private static final Logger logger = LoggerFactory.getLogger(WebImageProcessor.class);
    
    @Value("${webp.binary.path:./webp_binaries}")
    private String webpBinaryPath;

    /**
     * Check if the image format is supported for processing
     * 
     * @param imageData binary image data
     * @return true if format is supported, false otherwise
     */
    public boolean isSupportedFormat(byte[] imageData) {
        if (imageData == null || imageData.length < 12) {
            return false;
        }
        
        // Check for common image signatures
        // JPEG
        if (imageData[0] == (byte)0xFF && imageData[1] == (byte)0xD8) {
            return true;
        }
        
        // PNG
        if (imageData[0] == (byte)0x89 && imageData[1] == (byte)0x50 && 
            imageData[2] == (byte)0x4E && imageData[3] == (byte)0x47) {
            return true;
        }
        
        // GIF
        if (imageData[0] == (byte)0x47 && imageData[1] == (byte)0x49 && 
            imageData[2] == (byte)0x46 && imageData[3] == (byte)0x38) {
            return true;
        }
        
        // WebP
        if (imageData[8] == (byte)0x57 && imageData[9] == (byte)0x45 && 
            imageData[10] == (byte)0x42 && imageData[11] == (byte)0x50) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Convert image data to WebP format
     * 
     * @param imageData binary image data
     * @return WebP formatted binary data, or null if conversion fails
     */
    public byte[] convertToWebp(byte[] imageData) {
        if (imageData == null) {
            return null;
        }
        
        // First check if cwebp executable exists and is executable
        String cwebpExecutable = getCwebpExecutablePath();
        File cwebpFile = new File(cwebpExecutable);
        
        if (!cwebpFile.exists()) {
            logger.error("WebP converter executable not found at: {}", cwebpExecutable);
            // Return the original image data as fallback
            return imageData;
        }
        
        if (!cwebpFile.canExecute()) {
            logger.error("WebP converter executable found but is not executable: {}", cwebpExecutable);
            try {
                // Attempt to make it executable
                cwebpFile.setExecutable(true);
                logger.info("Successfully made WebP converter executable: {}", cwebpExecutable);
            } catch (SecurityException e) {
                logger.error("Failed to make WebP converter executable: {}", e.getMessage());
                // Return the original image data as fallback
                return imageData;
            }
        }
        
        try {
            // Create temporary files for input and output
            File inputFile = File.createTempFile("image_input_", ".bin");
            File outputFile = File.createTempFile("image_output_", ".webp");
            
            // Write input data to temp file
            Files.write(inputFile.toPath(), imageData);
            
            // Build command for converting to WebP
            String[] command = {
                cwebpExecutable,
                "-quiet",           // Less output
                "-q", "90",         // Quality 90
                inputFile.getAbsolutePath(),
                "-o", outputFile.getAbsolutePath()
            };
            
            // Log the exact command being executed
            logger.info("Executing WebP conversion command: {}", String.join(" ", command));
            
            // Execute conversion command
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            Process process = processBuilder.start();
            
            // Wait for process to complete
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                // Read output file into byte array
                byte[] webpData = Files.readAllBytes(outputFile.toPath());
                
                // Cleanup temp files
                inputFile.delete();
                outputFile.delete();
                
                logger.info("WebP conversion successful, converted image size: {} bytes", webpData.length);
                return webpData;
            } else {
                logger.error("WebP conversion failed with exit code: {}", exitCode);
                
                // Capture error output for logging
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    StringBuilder error = new StringBuilder();
                    while ((line = reader.readLine()) != null) {
                        error.append(line).append("\n");
                    }
                    logger.error("WebP conversion error: {}", error.toString());
                }
                
                // Cleanup temp files
                inputFile.delete();
                outputFile.delete();
                
                // Return the original image data as fallback
                logger.info("Returning original image as fallback (no conversion)");
                return imageData;
            }
        } catch (IOException | InterruptedException e) {
            logger.error("Error converting image to WebP: {}", e.getMessage(), e);
            // Return the original image data as fallback
            return imageData;
        }
    }
    
    /**
     * Get the path to the cwebp executable based on the operating system
     * 
     * @return path to cwebp executable
     */
    private String getCwebpExecutablePath() {
        String osName = System.getProperty("os.name").toLowerCase();
        
        Path binaryPath = Paths.get(webpBinaryPath);
        
        if (osName.contains("win")) {
            return binaryPath.resolve("cwebp.exe").toString();
        } else if (osName.contains("mac")) {
            return binaryPath.resolve("cwebp_mac").toString();
        } else {
            // Linux and other unix-like systems
            return binaryPath.resolve("cwebp").toString();
        }
    }
}