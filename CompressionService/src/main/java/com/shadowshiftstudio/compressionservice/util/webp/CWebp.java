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
            // Проверяем, установлен ли путь через системное свойство от WebpInitializer
            String configuredPath = System.getProperty("webp.binary.path");
            if (configuredPath != null && !configuredPath.trim().isEmpty()) {
                Path path = Paths.get(configuredPath);
                if (Files.exists(path) && Files.isExecutable(path)) {
                    cwebpPath = configuredPath;
                    webpBinaryInitialized = true;
                    logger.info("Successfully initialized WebP binary at: " + cwebpPath);
                    return;
                } else {
                    logger.warning("Configured WebP binary path is invalid: " + configuredPath);
                }
            }

            // Попытка найти бинарный файл в контейнере Docker
            Path[] possibleDockerPaths = {
                Paths.get(DOCKER_WEBP_PATH, "cwebp"),
                Paths.get("/webp_binaries/cwebp"),
                Paths.get("/usr/local/bin/cwebp"),
                Paths.get("/usr/bin/cwebp")
            };
            
            for (Path path : possibleDockerPaths) {
                if (Files.exists(path) && Files.isExecutable(path)) {
                    cwebpPath = path.toString();
                    webpBinaryInitialized = true;
                    logger.info("Found WebP binary in container at: " + cwebpPath);
                    return;
                }
            }

            // Если не нашли в контейнере, пробуем скачать и установить в DOCKER_WEBP_PATH
            Path dockerWebpDir = Paths.get(DOCKER_WEBP_PATH);
            if (!Files.exists(dockerWebpDir)) {
                try {
                    Files.createDirectories(dockerWebpDir);
                    logger.info("Created directory for WebP binaries at: " + dockerWebpDir);
                } catch (Exception e) {
                    logger.warning("Failed to create directory at " + dockerWebpDir + ": " + e.getMessage());
                }
            }

            // Если предыдущие методы не сработали, ищем в PATH
            boolean isAvailable = checkCWebpInPath();
            if (isAvailable) {
                cwebpPath = "cwebp";
                webpBinaryInitialized = true;
                logger.info("cwebp found in system PATH");
                return;
            }

            // Если не нашли нигде, создаем свою копию
            // If not available in PATH, check or create binary directory
            Path webpDir = Paths.get(System.getProperty("user.dir"), WEBP_BINARY_PATH);
            if (!Files.exists(webpDir)) {
                Files.createDirectories(webpDir);
            }

            // Determine platform and download appropriate WebP binary
            String os = System.getProperty("os.name").toLowerCase();
            String arch = System.getProperty("os.arch").toLowerCase();

            Path binPath;
            if (os.contains("win")) {
                binPath = downloadWindowsBinary(webpDir);
            } else if (os.contains("mac") || os.contains("darwin")) {
                binPath = downloadMacBinary(webpDir, arch);
            } else {
                binPath = downloadLinuxBinary(webpDir, arch);
            }

            if (binPath != null) {
                cwebpPath = binPath.toAbsolutePath().toString();
                makeExecutable(binPath);
                webpBinaryInitialized = true;
                logger.info("Successfully initialized WebP binary at: " + cwebpPath);
            } else {
                logger.severe("Failed to initialize WebP binary");
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error initializing WebP binary", e);
        }
    }

    /**
     * Check if cwebp is available in system PATH
     */
    private static boolean checkCWebpInPath() {
        try {
            Process process;
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                process = Runtime.getRuntime().exec(new String[]{"where", "cwebp"});
            } else {
                process = Runtime.getRuntime().exec(new String[]{"which", "cwebp"});
            }

            boolean completed = process.waitFor(5, TimeUnit.SECONDS);
            return completed && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Download Windows binary
     */
    private static Path downloadWindowsBinary(Path webpDir) throws IOException {
        String url = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-windows-x64.zip";
        Path zipFile = webpDir.resolve("libwebp-windows.zip");

        downloadFile(url, zipFile);
        Path binPath = webpDir.resolve("cwebp.exe");

        try (ZipInputStream zipIn = new ZipInputStream(new FileInputStream(zipFile.toFile()))) {
            ZipEntry entry;
            while ((entry = zipIn.getNextEntry()) != null) {
                if (entry.getName().endsWith("bin/cwebp.exe")) {
                    Files.copy(zipIn, binPath, StandardCopyOption.REPLACE_EXISTING);
                    break;
                }
            }
        }

        return binPath;
    }

    /**
     * Download Mac binary
     */
    private static Path downloadMacBinary(Path webpDir, String arch) throws IOException, InterruptedException {
        String url;
        if (arch.contains("aarch64") || arch.contains("arm")) {
            url = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-mac-arm64.tar.gz";
        } else {
            url = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-mac-x86-64.tar.gz";
        }

        Path tarFile = webpDir.resolve("libwebp-mac.tar.gz");
        downloadFile(url, tarFile);

        // Extract using system tar command
        Path binPath = webpDir.resolve("cwebp");
        Process process = Runtime.getRuntime().exec(new String[]{
            "tar", "-xzf", tarFile.toString(), "--strip-components=2",
            "-C", webpDir.toString(), "libwebp-1.3.2-mac-*/bin/cwebp"
        });

        process.waitFor(30, TimeUnit.SECONDS);

        return binPath;
    }

    /**
     * Download Linux binary
     */
    private static Path downloadLinuxBinary(Path webpDir, String arch) throws IOException, InterruptedException {
        String url;
        if (arch.contains("aarch64") || arch.contains("arm")) {
            url = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-linux-arm64.tar.gz";
        } else {
            url = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-linux-x86-64.tar.gz";
        }

        Path tarFile = webpDir.resolve("libwebp-linux.tar.gz");
        downloadFile(url, tarFile);

        // Extract using system tar command
        Path binPath = webpDir.resolve("cwebp");
        Process process = Runtime.getRuntime().exec(new String[]{
            "tar", "-xzf", tarFile.toString(), "--strip-components=2",
            "-C", webpDir.toString(), "libwebp-1.3.2-linux-*/bin/cwebp"
        });

        process.waitFor(30, TimeUnit.SECONDS);

        return binPath;
    }

    /**
     * Make a file executable
     */
    private static void makeExecutable(Path path) {
        try {
            if (!System.getProperty("os.name").toLowerCase().contains("win")) {
                Runtime.getRuntime().exec(new String[]{"chmod", "+x", path.toString()}).waitFor();
            }
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to make file executable: " + path, e);
        }
    }

    /**
     * Download a file from a URL
     */
    private static void downloadFile(String url, Path destination) throws IOException {
        try (ReadableByteChannel readChannel = Channels.newChannel(new URL(url).openStream());
             FileOutputStream fileOS = new FileOutputStream(destination.toFile())) {
            fileOS.getChannel().transferFrom(readChannel, 0, Long.MAX_VALUE);
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
            ByteArrayOutputStream errorOutput = new ByteArrayOutputStream();
            Process process = pb.start();
            
            // Start thread to read error stream
            Thread errorThread = startOutputThread(process.getErrorStream(), errorOutput);
            
            // Wait for process to complete with timeout
            boolean completed = process.waitFor(30, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new IOException("WebP conversion process timed out");
            }
            
            // Wait for error thread to complete
            errorThread.join(5000);
            
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                this.processError = new String(errorOutput.toByteArray());
                logger.warning("cwebp process error: " + this.processError);
                throw new IOException("WebP conversion failed with exit code: " + exitCode);
            }
            
            // Read output file if it exists
            if (Files.exists(tempOutputFile)) {
                byte[] webpData = Files.readAllBytes(tempOutputFile);
                this.processOutput = "Success, generated " + webpData.length + " bytes";
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
     * Helper method to start a thread that reads from an input stream and writes to an output stream
     */
    private Thread startOutputThread(final InputStream input, final ByteArrayOutputStream output) {
        Thread thread = new Thread(() -> {
            try {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = input.read(buffer)) != -1) {
                    output.write(buffer, 0, bytesRead);
                }
            } catch (IOException e) {
                logger.log(Level.WARNING, "Error reading process output", e);
            }
        });
        thread.start();
        return thread;
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
