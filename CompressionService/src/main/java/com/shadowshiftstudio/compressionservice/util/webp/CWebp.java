package com.shadowshiftstudio.compressionservice.util.webp;

import java.io.*;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 * util for create and execute cwebp command to compresses an image using the WebP format.
 * Input format can be either PNG, JPEG, TIFF, WebP or raw Y'CbCr samples.
 * Note: Animated PNG and WebP files are not supported.
 */
public class CWebp {

    private static final Logger logger = Logger.getLogger(CWebp.class.getName());
    
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
        command = new StringBuffer();
        command.append("cwebp ");
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
        if(level > 100 || level < 0){
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
        if(quality > 100 || quality < 0){
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
        if(alpha > 100 || alpha < 0){
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
    public CWebp crop(int x_position, int y_position ,int width , int height) {
        if(width == 0 || height == 0){
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
    public CWebp resize(int width , int height) {
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
        if(size <= 0){
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
        if(strength < 0 || strength > 7) {
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
        if(strength < 0 || strength > 100) {
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

    /**
     * Check if the cwebp command is available in the system
     * @return true if available, false otherwise
     */
    public static boolean isAvailable() {
        Process process = null;
        try {
            ProcessBuilder pb = new ProcessBuilder("cwebp", "-version");
            process = pb.start();
            return process.waitFor(3, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (IOException | InterruptedException e) {
            logger.log(Level.WARNING, "cwebp command not available", e);
            return false;
        } finally {
            if(process != null) {
                process.destroy();
            }
        }
    }

    /**
     * Executes the specified string command in a separate process.
     * @throws CWebpException if the command fails to execute
     */
    public void execute() throws CWebpException {
        Process process = null;
        try {
            String cmd = command.toString();
            logger.log(Level.INFO, "Executing command: {0}", cmd);
            
            process = Runtime.getRuntime().exec(cmd);
            
            // Capture the output and error streams
            try (BufferedReader outputReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                
                StringBuilder outputBuilder = new StringBuilder();
                StringBuilder errorBuilder = new StringBuilder();
                String line;
                
                while ((line = outputReader.readLine()) != null) {
                    outputBuilder.append(line).append(System.lineSeparator());
                }
                
                while ((line = errorReader.readLine()) != null) {
                    errorBuilder.append(line).append(System.lineSeparator());
                }
                
                processOutput = outputBuilder.toString();
                processError = errorBuilder.toString();
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new CWebpException("cwebp command failed with exit code " + exitCode + ". Error: " + processError);
            }
        } catch (IOException | InterruptedException e) {
            throw new CWebpException(e);
        } finally {
            if(process != null) {
                process.destroy();
            }
        }
    }
}
