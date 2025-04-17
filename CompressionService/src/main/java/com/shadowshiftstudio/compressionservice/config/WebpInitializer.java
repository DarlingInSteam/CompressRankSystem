package com.shadowshiftstudio.compressionservice.config;

import com.shadowshiftstudio.compressionservice.util.webp.CWebp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.env.Environment;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashSet;
import java.util.Set;

@Configuration
public class WebpInitializer {
    
    private static final Logger log = LoggerFactory.getLogger(WebpInitializer.class);
    private final ResourceLoader resourceLoader;
    private final Environment environment;

    // Приоритезируем системные бинарные файлы
    private static final String[] POSSIBLE_BINARY_LOCATIONS = {
        "/usr/bin/cwebp",
        "/usr/local/bin/cwebp",
        "/bin/cwebp",
        "/app/webp_binaries/cwebp",
        "webp_binaries/cwebp",
        "cwebp"
    };
    
    public WebpInitializer(ResourceLoader resourceLoader, Environment environment) {
        this.resourceLoader = resourceLoader;
        this.environment = environment;
    }
    
    @Bean
    public CommandLineRunner initializeWebp() {
        return args -> {
            log.info("Initializing WebP binary...");
            try {
                // Проверяем, установлен ли webp в системе
                Path systemWebpPath = findSystemWebpBinary();
                if (systemWebpPath != null) {
                    // Используем найденный системный бинарный файл
                    ensureExecutable(systemWebpPath);
                    System.setProperty("webp.binary.path", systemWebpPath.toString());
                    log.info("Using system WebP binary: {}", systemWebpPath);
                    
                    // Проверяем корректность работы бинарного файла
                    verifyWebpBinary(systemWebpPath);
                    return;
                }
                
                // Если не нашли в системе, проверяем в наших директориях
                Path projectRootWebpBinary = null;
                String osName = System.getProperty("os.name").toLowerCase();
                boolean isWindows = osName.contains("win");
                
                // Look for binaries in the project's webp_binaries folder
                Path externalBinaryDir = Paths.get("webp_binaries");
                if (Files.exists(externalBinaryDir)) {
                    if (isWindows) {
                        projectRootWebpBinary = externalBinaryDir.resolve("cwebp.exe");
                    } else {
                        projectRootWebpBinary = externalBinaryDir.resolve("cwebp");
                    }
                    
                    if (Files.exists(projectRootWebpBinary)) {
                        log.info("Found WebP binary in project directory at: {}", projectRootWebpBinary);
                    } else {
                        projectRootWebpBinary = null;
                    }
                }
                
                // Create target directory in container
                Path targetBinaryDir = Paths.get("/app/webp_binaries");
                if (!Files.exists(targetBinaryDir)) {
                    Files.createDirectories(targetBinaryDir);
                    log.info("Created directory: {}", targetBinaryDir);
                }
                
                Path targetBinaryPath = targetBinaryDir.resolve("cwebp");
                
                if (projectRootWebpBinary != null) {
                    // Copy from project directory to target directory
                    log.info("Copying WebP binary from project directory: {} to {}", projectRootWebpBinary, targetBinaryPath);
                    Files.copy(projectRootWebpBinary, targetBinaryPath, StandardCopyOption.REPLACE_EXISTING);
                    ensureExecutable(targetBinaryPath);
                    System.setProperty("webp.binary.path", targetBinaryPath.toString());
                    log.info("WebP binary path set to: {}", targetBinaryPath);
                } else {
                    // Если WebP бинарный файл не найден, установим его в системе
                    log.info("Installing WebP package from system repositories...");
                    installWebpPackage();
                    
                    // Проверяем еще раз после установки
                    systemWebpPath = findSystemWebpBinary();
                    if (systemWebpPath != null) {
                        ensureExecutable(systemWebpPath);
                        System.setProperty("webp.binary.path", systemWebpPath.toString());
                        log.info("Using newly installed system WebP binary: {}", systemWebpPath);
                    } else {
                        log.error("Failed to find or install WebP binary. Compression service may not work correctly.");
                    }
                }
                
                // Verify the binary works
                if (Files.exists(targetBinaryPath)) {
                    verifyWebpBinary(targetBinaryPath);
                }
            } catch (Exception e) {
                log.error("Failed to initialize WebP binary", e);
            }
        };
    }

    private Path findSystemWebpBinary() {
        // Check standard system paths
        for (String location : POSSIBLE_BINARY_LOCATIONS) {
            Path binaryPath = Paths.get(location);
            if (Files.exists(binaryPath)) {
                log.info("Found WebP binary at system location: {}", binaryPath);
                return binaryPath;
            }
        }
        
        // Try to find with which/where command
        try {
            String command = System.getProperty("os.name").toLowerCase().contains("win") ? "where cwebp" : "which cwebp";
            Process process = Runtime.getRuntime().exec(command);
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                if (line != null && !line.isEmpty()) {
                    Path systemPath = Paths.get(line.trim());
                    if (Files.exists(systemPath)) {
                        log.info("Found WebP binary using system command at: {}", systemPath);
                        return systemPath;
                    }
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.debug("WebP binary not found in PATH (exit code: {})", exitCode);
            }
        } catch (Exception e) {
            log.debug("Failed to find WebP binary using system command: {}", e.getMessage());
        }
        
        return null;
    }
    
    private void installWebpPackage() {
        try {
            // Определяем, какой пакетный менеджер использовать
            boolean isAptAvailable = checkCommandAvailable("apt");
            boolean isYumAvailable = checkCommandAvailable("yum");
            boolean isApkAvailable = checkCommandAvailable("apk");
            
            String installCommand = null;
            if (isAptAvailable) {
                installCommand = "apt-get update && apt-get install -y webp";
            } else if (isYumAvailable) {
                installCommand = "yum install -y libwebp-tools";
            } else if (isApkAvailable) {
                installCommand = "apk add --no-cache libwebp-tools";
            }
            
            if (installCommand != null) {
                log.info("Running package installation command: {}", installCommand);
                Process process = Runtime.getRuntime().exec(new String[]{"sh", "-c", installCommand});
                int exitCode = process.waitFor();
                
                if (exitCode == 0) {
                    log.info("WebP package installed successfully");
                } else {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                        String line;
                        StringBuilder error = new StringBuilder();
                        while ((line = reader.readLine()) != null) {
                            error.append(line).append("\n");
                        }
                        log.error("Failed to install WebP package. Exit code: {}, Error: {}", exitCode, error.toString());
                    }
                }
            } else {
                log.error("No suitable package manager found to install WebP");
            }
        } catch (Exception e) {
            log.error("Error installing WebP package", e);
        }
    }
    
    private boolean checkCommandAvailable(String command) {
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"which", command});
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void ensureExecutable(Path binaryPath) {
        try {
            // Try to use POSIX permissions if available
            Set<PosixFilePermission> permissions = new HashSet<>();
            permissions.add(PosixFilePermission.OWNER_READ);
            permissions.add(PosixFilePermission.OWNER_WRITE);
            permissions.add(PosixFilePermission.OWNER_EXECUTE);
            permissions.add(PosixFilePermission.GROUP_READ);
            permissions.add(PosixFilePermission.GROUP_EXECUTE);
            permissions.add(PosixFilePermission.OTHERS_READ);
            permissions.add(PosixFilePermission.OTHERS_EXECUTE);
            
            try {
                Files.setPosixFilePermissions(binaryPath, permissions);
                log.info("Set executable permissions on: {}", binaryPath);
            } catch (UnsupportedOperationException e) {
                // Not a POSIX filesystem, try chmod as fallback
                throw e;
            }
        } catch (Exception e) {
            // Fallback: try using chmod command
            try {
                Process process = Runtime.getRuntime().exec("chmod +x " + binaryPath);
                int exitCode = process.waitFor();
                log.info("chmod +x command executed with exit code: {}", exitCode);
                
                if (exitCode != 0) {
                    // Read error stream
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            log.warn("chmod error: {}", line);
                        }
                    }
                }
            } catch (Exception e2) {
                log.warn("Failed to set executable permissions: {}", e2.getMessage());
            }
        }
    }

    private void verifyWebpBinary(Path binaryPath) {
        try {
            log.info("Verifying WebP binary at: {}", binaryPath);
            
            // Try with -version flag first
            Process process = Runtime.getRuntime().exec(binaryPath + " -version");
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String version = reader.readLine();
                    log.info("WebP binary successfully initialized. Version: {}", version);
                }
            } else {
                log.error("WebP binary test failed with exit code: {}", exitCode);
                
                // Check error output if available
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    String errorLine;
                    while ((errorLine = reader.readLine()) != null) {
                        log.error("WebP binary error: {}", errorLine);
                    }
                }
                
                // If -version doesn't work, try with -h (help) as a fallback
                log.info("Trying fallback verification with -h flag");
                process = Runtime.getRuntime().exec(binaryPath + " -h");
                exitCode = process.waitFor();
                
                if (exitCode == 0) {
                    log.info("WebP binary verified with help flag, seems functional");
                } else {
                    log.error("WebP binary verification failed with both version and help flags");
                }
            }
        } catch (Exception e) {
            log.error("Failed to verify WebP binary: {}", e.getMessage());
        }
    }
}
