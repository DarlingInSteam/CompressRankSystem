package com.shadowshiftstudio.compressionservice.util.webp;

import java.io.*;
import java.net.URL;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * util for create and execute cwebp command to compresses an image using the WebP format.
 * Input format can be either PNG, JPEG, TIFF, WebP or raw Y'CbCr samples.
 * Note: Animated PNG and WebP files are not supported.
 */
public class CWebp {

    private static final Logger logger = Logger.getLogger(CWebp.class.getName());
    private static final String WEBP_BINARY_PATH = "webp_binaries";
    // Пути к бинарным файлам в Docker контейнере
    private static final String DOCKER_WEBP_PATH = "/app/webp_binaries";
    private static String cwebpPath = null;
    private static boolean webpBinaryInitialized = false;

    /**
     * StringBuffer of command line
     */
    private StringBuffer command;

    /**
     * Store the process output
     */
    private String processOutput;

    /**
     * Store the process error
     */
    private String processError;

    /**
     * Compress an image file to a WebP file
     */
    public CWebp() {
        if (!webpBinaryInitialized) {
            initializeWebpBinary();
        }
        command = new StringBuffer();
        command.append(cwebpPath != null ? cwebpPath : "cwebp ");
        if (!command.toString().endsWith(" ")) {
            command.append(" ");
        }
    }

    /**
     * Initialize WebP binary by checking if it exists in PATH or downloading/extracting it if needed
     */
    private static synchronized void initializeWebpBinary() {
        if (webpBinaryInitialized) {
            return;
        }

        try {
            // Сначала проверяем системное свойство из WebpInitializer
            String configuredPath = System.getProperty("webp.binary.path");
            if (configuredPath != null && !configuredPath.trim().isEmpty()) {
                Path path = Paths.get(configuredPath);
                if (Files.exists(path)) {
                    // Проверяем только существование файла без запуска с -version
                    setExecutablePermissions(path.toFile());
                    cwebpPath = configuredPath;
                    webpBinaryInitialized = true;
                    logger.info("Using WebP binary from system property: " + cwebpPath);
                    return;
                } else {
                    logger.warning("Configured WebP binary path is invalid: " + configuredPath);
                }
            }

            // Проверяем переменную окружения
            String envPath = System.getenv("WEBP_BINARY_PATH");
            if (envPath != null && !envPath.trim().isEmpty()) {
                Path path = Paths.get(envPath);
                if (Files.exists(path)) {
                    // Проверяем только существование файла без запуска с -version
                    setExecutablePermissions(path.toFile());
                    cwebpPath = envPath;
                    webpBinaryInitialized = true;
                    logger.info("Using WebP binary from environment variable: " + cwebpPath);
                    return;
                } else {
                    logger.warning("Environment variable WEBP_BINARY_PATH is invalid: " + envPath);
                }
            }

            // Проверяем стандартные системные пути в контейнере
            String[] possiblePaths = {
                "/app/webp_binaries/cwebp",
                "/usr/bin/cwebp",
                "/usr/local/bin/cwebp",
                "/bin/cwebp",
                "/opt/bin/cwebp"
            };
            
            for (String path : possiblePaths) {
                if (Files.exists(Paths.get(path))) {
                    File binaryFile = new File(path);
                    setExecutablePermissions(binaryFile);
                    cwebpPath = path;
                    webpBinaryInitialized = true;
                    logger.info("Found WebP binary at: " + cwebpPath);
                    return;
                }
            }

            // Попытка найти бинарный файл в системе через which/where
            try {
                String command = System.getProperty("os.name").toLowerCase().contains("win") ? "where cwebp" : "which cwebp";
                Process process = Runtime.getRuntime().exec(command);
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line = reader.readLine();
                    if (line != null && !line.isEmpty()) {
                        String systemPath = line.trim();
                        File binaryFile = new File(systemPath);
                        if (binaryFile.exists()) {
                            setExecutablePermissions(binaryFile);
                            cwebpPath = systemPath;
                            webpBinaryInitialized = true;
                            logger.info("Found WebP binary in system PATH: " + cwebpPath);
                            return;
                        }
                    }
                }
                process.waitFor(2, TimeUnit.SECONDS);
            } catch (Exception e) {
                logger.info("Could not find cwebp in system PATH: " + e.getMessage());
            }

            // На этом этапе мы не смогли найти подходящий бинарный файл, завершаем с ошибкой
            String errorMsg = "Failed to find a working WebP binary. Please install the webp package on your system or container.";
            logger.severe(errorMsg);
            throw new IOException(errorMsg);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error initializing WebP binary", e);
            // Не прячем исключение, пусть приложение знает, что возникла проблема
            if (!webpBinaryInitialized) {
                throw new RuntimeException("Failed to initialize WebP binary: " + e.getMessage(), e);
            }
        }
    }

    /**
     * Sets executable permissions on the binary file
     */
    private static void setExecutablePermissions(File file) {
        if (!file.canExecute()) {
            try {
                // Attempt to set executable permissions
                boolean success = file.setExecutable(true);
                if (success) {
                    logger.info("Successfully set executable permissions on: " + file.getAbsolutePath());
                } else {
                    // If direct method fails, try chmod command
                    try {
                        ProcessBuilder pb = new ProcessBuilder("chmod", "+x", file.getAbsolutePath());
                        Process process = pb.start();
                        process.waitFor(2, TimeUnit.SECONDS);
                        logger.info("Attempted to set permissions using chmod on: " + file.getAbsolutePath());
                    } catch (Exception e) {
                        logger.warning("Failed to set executable permissions with chmod: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.warning("Failed to set executable permissions: " + e.getMessage());
            }
        }
    }

    /**
     * Convert raw image bytes to WebP format using temporary files
     * @param imageData input image data as byte array
     * @return WebP image data as byte array
     * @throws IOException if the conversion fails
     */
    public byte[] convertFromBytes(byte[] imageData) throws IOException {
        if (!webpBinaryInitialized || cwebpPath == null) {
            throw new IOException("WebP binary is not available. Please install cwebp or restart the service.");
        }
        
        // Create temporary directory for input and output files
        Path tempDir = Files.createTempDirectory("webp_conversion_");
        Path tempInputFile = tempDir.resolve("input_image.bin");
        Path tempOutputFile = tempDir.resolve("output_image.webp");
        
        try {
            // Write input data to temporary file
            Files.write(tempInputFile, imageData);
            
            // Prepare command with temporary files
            String finalCommand = this.getCommand();
            
            // Ensure command doesn't already have input or output parameters
            if (!finalCommand.contains(" -o ")) {
                finalCommand += " -o " + tempOutputFile.toString();
            }
            
            // Add input file as the last parameter if not already present
            if (!finalCommand.contains(tempInputFile.toString())) {
                finalCommand += " " + tempInputFile.toString();
            }
            
            logger.info("Executing WebP command: " + finalCommand);
            
            // Build and start process
            ProcessBuilder pb;
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                pb = new ProcessBuilder("cmd.exe", "/c", finalCommand);
            } else {
                pb = new ProcessBuilder("sh", "-c", finalCommand);
            }
            
            // Redirect error stream to capture any error messages
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Capture output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            // Wait for process to complete with timeout
            boolean completed = process.waitFor(30, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new IOException("WebP conversion process timed out");
            }
            
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                this.processError = output.toString();
                logger.warning("cwebp process error: " + this.processError);
                throw new IOException("WebP conversion failed with exit code: " + exitCode);
            } else {
                this.processOutput = output.toString();
                logger.info("WebP conversion succeeded: " + this.processOutput);
            }
            
            // Read output file if it exists
            if (Files.exists(tempOutputFile)) {
                byte[] webpData = Files.readAllBytes(tempOutputFile);
                return webpData;
            } else {
                throw new IOException("WebP output file was not created");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("WebP conversion was interrupted", e);
        } finally {
            // Clean up temporary files
            try {
                if (Files.exists(tempInputFile)) Files.delete(tempInputFile);
                if (Files.exists(tempOutputFile)) Files.delete(tempOutputFile);
                Files.delete(tempDir);
            } catch (IOException e) {
                logger.log(Level.WARNING, "Failed to clean up temporary files", e);
            }
        }
    }

    /**
     * Encode the image without any loss.
     * For images with fully transparent area, the invisible pixel values (R/G/B or Y/U/V) will be preserved only if the -exact option is used.
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp lossless() {
        command.append("-lossless ");
        return this;
    }

    /**
     * Specify the level of near-lossless image preprocessing.
     * This option adjusts pixel values to help compressibility,
     * but has minimal impact on the visual quality.
     * It triggers lossless compression mode automatically.
     * The range is 0 (maximum preprocessing) to 100 (no preprocessing, the default).
     * The typical value is around 60. Note that lossy with -q 100 can at times yield better results.
     * @param level level of near-lossless
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp nearLossless(int level) {
        if (level > 100 || level < 0) {
            return this;
        }
        command.append("-near_lossless ");
        command.append(level + " ");
        return this;
    }

    /**
     * Specify the compression factor for RGB channels between 0 and 100. The default is 75.
     * In case of lossy compression (default), a small factor produces a smaller file with lower quality. Best quality is achieved by using a value of 100.
     * In case of lossless compression (specified by the -lossless option), a small factor enables faster compression speed, but produces a larger file.
     * Maximum compression is achieved by using a value of 100.
     * @param quality compression factor for RGB channels
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp quality(int quality) {
        if (quality > 100 || quality < 0) {
            return this;
        }
        command.append("-q ");
        command.append(quality + " ");
        return this;
    }

    /**
     * Specify the compression factor for alpha compression between 0 and 100.
     * Lossless compression of alpha is achieved using a value of 100, while the lower values result in a lossy compression.
     * The default is 100.
     * @param alpha compression factor for alpha
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp alphaQ(int alpha) {
        if (alpha > 100 || alpha < 0) {
            return this;
        }
        command.append("-alpha_q ");
        command.append(alpha + " ");
        return this;
    }

    /**
     * Reduce memory usage of lossy encoding by saving four times the compressed size (typically).
     * This will make the encoding slower and the output slightly different in size and distortion.
     * This flag is only effective for methods 3 and up, and is off by default.
     * Note that leaving this flag off will have some side effects on the bitstream: it forces certain bitstream features like number of partitions (forced to 1).
     * Note that a more detailed report of bitstream size is printed by cwebp when using this option.
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp lowMemory() {
        command.append("-low_memory ");
        return this;
    }

    /**
     * Crop the source to a rectangle with top-left corner at coordinates (x_position, y_position) and size width x height.
     * This cropping area must be fully contained within the source rectangle.
     * Note: the cropping is applied before any scaling.
     * @param x_position coordinates x_position
     * @param y_position coordinates y_position
     * @param width size width
     * @param height size height
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp crop(int x_position, int y_position, int width, int height) {
        if (width == 0 || height == 0) {
            return this;
        }
        command.append("-crop ");
        command.append(x_position + " ");
        command.append(y_position + " ");
        command.append(width + " ");
        command.append(height + " ");
        return this;
    }

    /**
     * Resize the source to a rectangle with size width x height.
     * If either (but not both) of the width or height parameters is 0,
     * the value will be calculated preserving the aspect-ratio.
     * Note: scaling is applied after cropping.
     * @param width size width
     * @param height size height
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp resize(int width, int height) {
        command.append("-resize ");
        command.append(width + " ");
        command.append(height + " ");
        return this;
    }

    /**
     * Set metadata in the output WebP file
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp setMetadata(String metadata) {
        command.append("-metadata ");
        command.append(metadata + " ");
        return this;
    }

    /**
     * Preserve RGB values in transparent area
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp exact() {
        command.append("-exact ");
        return this;
    }

    /**
     * Specify a maximum file size to aim for, expressed in bytes
     * @param size maximum file size in bytes
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp size(int size) {
        if (size <= 0) {
            return this;
        }
        command.append("-size ");
        command.append(size + " ");
        return this;
    }

    /**
     * Preprocessing filter that sharpens the converted picture
     * @param strength between 0 and 7, default is 0 (no filter)
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp sharpness(int strength) {
        if (strength < 0 || strength > 7) {
            return this;
        }
        command.append("-sharpness ");
        command.append(strength + " ");
        return this;
    }

    /**
     * Preprocessing filter for strong noise
     * @param strength between 0 and 100, default is 0 (no filter)
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp strongNoise(int strength) {
        if (strength < 0 || strength > 100) {
            return this;
        }
        command.append("-sns ");
        command.append(strength + " ");
        return this;
    }

    /**
     * Explicitly specify the input file.
     * This option is useful if the input file starts with an '-' for instance.
     * This option must appear last. Any other options afterward will be ignored.
     * @param inputPath input file path
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp input(String inputPath) {
        command.append(inputPath + " ");
        return this;
    }

    /**
     * -o string
     * Specify the name of the output WebP file.
     * If omitted, cwebp will perform compression but only report statistics.
     * Using "-" as output name will direct output to 'stdout'.
     * @param outputPath  output WebP file
     * @return A new {@link CWebp} object for managing the subprocess
     */
    public CWebp output(String outputPath) {
        command.append("-o ");
        command.append(outputPath + " ");
        return this;
    }

    /**
     * Shows the command that would be executed
     */
    public String getCommand() {
        return command.toString();
    }

    /**
     * Returns the output from the process
     */
    public String getProcessOutput() {
        return processOutput;
    }

    /**
     * Returns any error message from the process
     */
    public String getProcessError() {
        return processError;
    }
}
