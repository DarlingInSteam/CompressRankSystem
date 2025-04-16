package com.shadowshiftstudio.compressionservice.config;

import com.shadowshiftstudio.compressionservice.util.webp.CWebp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.*;
import java.net.URL;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashSet;
import java.util.Set;

/**
 * Initializes WebP binary at application startup
 */
@Configuration
public class WebpInitializer {
    
    private static final Logger log = LoggerFactory.getLogger(WebpInitializer.class);
    private final ResourceLoader resourceLoader;
    
    // Пути для поиска бинарных файлов WebP
    private static final String[] POSSIBLE_BINARY_LOCATIONS = {
        "/webp_binaries/cwebp",
        "/usr/local/bin/cwebp",
        "/usr/bin/cwebp",
        "webp_binaries/cwebp",
        "cwebp"
    };
    
    // URL для загрузки WebP бинарных файлов
    private static final String WEBP_LINUX_DOWNLOAD_URL = 
        "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-linux-x86-64.tar.gz";
    
    public WebpInitializer(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }
    
    @Bean
    public CommandLineRunner initializeWebp() {
        return args -> {
            log.info("Initializing WebP binary...");
            try {
                // Создаем директорию для бинарных файлов если её нет
                Path targetBinaryDir = Paths.get("/app/webp_binaries");
                if (!Files.exists(targetBinaryDir)) {
                    Files.createDirectories(targetBinaryDir);
                    log.info("Created directory: {}", targetBinaryDir);
                }
                
                Path targetBinaryPath = targetBinaryDir.resolve("cwebp");
                
                // Определяем операционную систему
                String os = System.getProperty("os.name").toLowerCase();
                boolean isWindows = os.contains("win");
                
                // 1. Сначала проверяем, есть ли у нас бинарный файл в корне проекта
                log.info("Searching for WebP binary in project directories...");
                
                // Пробуем найти бинарный файл webp
                Path foundBinary = findWebpBinary();
                
                if (foundBinary != null) {
                    // Копируем найденный бинарный файл в целевую директорию
                    log.info("Found WebP binary at: {}, copying to: {}", foundBinary, targetBinaryPath);
                    Files.copy(foundBinary, targetBinaryPath, StandardCopyOption.REPLACE_EXISTING);
                } else {
                    // Если не нашли, пробуем загрузить из интернета
                    log.info("WebP binary not found locally, downloading...");
                    downloadAndExtractWebpBinary(targetBinaryDir, isWindows);
                }
                
                // Устанавливаем права на выполнение
                if (!isWindows) {
                    try {
                        Set<PosixFilePermission> permissions = new HashSet<>();
                        permissions.add(PosixFilePermission.OWNER_READ);
                        permissions.add(PosixFilePermission.OWNER_WRITE);
                        permissions.add(PosixFilePermission.OWNER_EXECUTE);
                        permissions.add(PosixFilePermission.GROUP_READ);
                        permissions.add(PosixFilePermission.GROUP_EXECUTE);
                        permissions.add(PosixFilePermission.OTHERS_READ);
                        permissions.add(PosixFilePermission.OTHERS_EXECUTE);
                        Files.setPosixFilePermissions(targetBinaryPath, permissions);
                        log.info("Set executable permissions on: {}", targetBinaryPath);
                    } catch (UnsupportedOperationException e) {
                        // Если не поддерживаются POSIX права, используем Runtime
                        Process process = Runtime.getRuntime().exec("chmod +x " + targetBinaryPath);
                        int exitCode = process.waitFor();
                        log.info("chmod +x command executed with exit code: {}", exitCode);
                    }
                }
                
                // Устанавливаем системное свойство с путем к бинарному файлу
                if (Files.exists(targetBinaryPath)) {
                    System.setProperty("webp.binary.path", targetBinaryPath.toString());
                    log.info("WebP binary path set to: {}", targetBinaryPath);
                    
                    // Проверяем, что файл работает
                    Process process = Runtime.getRuntime().exec(targetBinaryPath + " -version");
                    int exitCode = process.waitFor();
                    if (exitCode == 0) {
                        log.info("WebP binary successfully initialized and verified");
                    } else {
                        log.error("WebP binary test failed with exit code: {}", exitCode);
                    }
                } else {
                    log.error("WebP binary not found at path: {}", targetBinaryPath);
                }
            } catch (Exception e) {
                log.error("Failed to initialize WebP binary", e);
            }
        };
    }
    
    /**
     * Поиск бинарного файла WebP в возможных местах расположения
     */
    private Path findWebpBinary() {
        // Проверяем различные возможные пути
        for (String location : POSSIBLE_BINARY_LOCATIONS) {
            Path binaryPath = Paths.get(location);
            if (Files.exists(binaryPath)) {
                return binaryPath;
            }
            
            // Проверяем также в resources
            try {
                Resource resource = resourceLoader.getResource("classpath:" + location);
                if (resource.exists()) {
                    // Нашли в ресурсах, копируем во временный файл
                    Path tempFile = Files.createTempFile("cwebp", "");
                    try (InputStream is = resource.getInputStream()) {
                        Files.copy(is, tempFile, StandardCopyOption.REPLACE_EXISTING);
                    }
                    return tempFile;
                }
            } catch (IOException e) {
                log.debug("Error checking resource: {}", e.getMessage());
            }
        }
        
        // Проверяем webp_binaries в корне проекта
        Path externalBinaryDir = Paths.get("webp_binaries");
        if (Files.exists(externalBinaryDir)) {
            Path linuxBinary = externalBinaryDir.resolve("cwebp");
            Path windowsBinary = externalBinaryDir.resolve("cwebp.exe");
            
            if (Files.exists(linuxBinary)) {
                log.info("Found Linux WebP binary at: {}", linuxBinary);
                return linuxBinary;
            } else if (Files.exists(windowsBinary)) {
                log.info("Found Windows WebP binary at: {}", windowsBinary);
                return windowsBinary;
            }
        }
        
        return null;
    }
    
    /**
     * Загрузка и распаковка бинарного файла WebP
     */
    private void downloadAndExtractWebpBinary(Path targetDir, boolean isWindows) throws IOException, InterruptedException {
        String url = WEBP_LINUX_DOWNLOAD_URL;
        String filename = isWindows ? "webp-windows.zip" : "webp-linux.tar.gz";
        Path downloadedFile = targetDir.resolve(filename);
        
        // Загружаем файл
        log.info("Downloading WebP binary from: {}", url);
        try (ReadableByteChannel readChannel = Channels.newChannel(new URL(url).openStream());
             FileOutputStream fileOS = new FileOutputStream(downloadedFile.toFile())) {
            fileOS.getChannel().transferFrom(readChannel, 0, Long.MAX_VALUE);
        }
        
        // Распаковываем файл
        log.info("Extracting WebP binary from: {}", downloadedFile);
        if (isWindows) {
            // TODO: Распаковка ZIP для Windows
        } else {
            // Распаковка TAR.GZ для Linux
            Process process = Runtime.getRuntime().exec(new String[]{
                "tar", "-xzf", downloadedFile.toString(), "--strip-components=2",
                "-C", targetDir.toString(), "libwebp-1.3.2-linux-x86-64/bin/cwebp"
            });
            int exitCode = process.waitFor();
            log.info("tar extraction completed with exit code: {}", exitCode);
        }
        
        // Удаляем загруженный архив
        Files.deleteIfExists(downloadedFile);
    }
}