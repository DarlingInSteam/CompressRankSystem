package com.shadowshiftstudio.compressionservice.util.webp;

/**
 * Configuration options for WebP conversion
 * This class provides a builder pattern to configure WebP conversion options
 */
public class WebpOptions {
    
    private int quality = 100;
    private int alphaQuality = 100;
    private boolean lossless = false;
    private boolean lowMemory = false;
    private boolean exact = false;
    
    // Resize options
    private int width = 0;
    private int height = 0;
    
    // Crop options
    private int cropX = 0;
    private int cropY = 0;
    private int cropWidth = 0;
    private int cropHeight = 0;
    
    // Filter options
    private int sharpness = 0;
    private int noiseFilter = 0;
    
    /**
     * Create default WebP options with quality=75
     */
    public WebpOptions() {
    }
    
    /**
     * Create WebP options with the specified quality
     * @param quality compression quality (0-100)
     */
    public WebpOptions(int quality) {
        this.quality = validateQuality(quality);
    }
    
    /**
     * Create WebP options for lossless compression
     * @param lossless true for lossless compression
     */
    public WebpOptions(boolean lossless) {
        this.lossless = lossless;
    }
    
    /**
     * Validate quality is in range 0-100
     * @param value quality value to validate
     * @return validated quality (capped at 0-100)
     */
    private int validateQuality(int value) {
        return Math.max(0, Math.min(100, value));
    }
    
    /**
     * Set compression quality (0-100)
     * Higher values mean better quality but larger files
     * @param quality compression quality (0-100)
     * @return this options object for chaining
     */
    public WebpOptions withQuality(int quality) {
        this.quality = validateQuality(quality);
        return this;
    }
    
    /**
     * Set alpha channel compression quality (0-100)
     * Higher values mean better alpha quality but larger files
     * @param alphaQuality alpha compression quality (0-100)
     * @return this options object for chaining
     */
    public WebpOptions withAlphaQuality(int alphaQuality) {
        this.alphaQuality = validateQuality(alphaQuality);
        return this;
    }
    
    /**
     * Set lossless compression mode
     * @param lossless true for lossless compression
     * @return this options object for chaining
     */
    public WebpOptions withLossless(boolean lossless) {
        this.lossless = lossless;
        return this;
    }
    
    /**
     * Set low memory mode (reduces memory usage but makes encoding slower)
     * @param lowMemory true to enable low memory mode
     * @return this options object for chaining
     */
    public WebpOptions withLowMemory(boolean lowMemory) {
        this.lowMemory = lowMemory;
        return this;
    }
    
    /**
     * Set exact mode (preserves RGB values in transparent areas)
     * @param exact true to preserve RGB values in transparent areas
     * @return this options object for chaining
     */
    public WebpOptions withExact(boolean exact) {
        this.exact = exact;
        return this;
    }
    
    /**
     * Set resize dimensions
     * If either width or height is 0, aspect ratio will be preserved
     * @param width target width
     * @param height target height
     * @return this options object for chaining
     */
    public WebpOptions withResize(int width, int height) {
        this.width = Math.max(0, width);
        this.height = Math.max(0, height);
        return this;
    }
    
    /**
     * Set crop region
     * @param x x-coordinate of top-left corner
     * @param y y-coordinate of top-left corner
     * @param width width of crop region
     * @param height height of crop region
     * @return this options object for chaining
     */
    public WebpOptions withCrop(int x, int y, int width, int height) {
        this.cropX = Math.max(0, x);
        this.cropY = Math.max(0, y);
        this.cropWidth = Math.max(0, width);
        this.cropHeight = Math.max(0, height);
        return this;
    }
    
    /**
     * Set sharpness filter level (0-7)
     * Higher values result in more sharpening
     * @param sharpness sharpness level (0-7)
     * @return this options object for chaining
     */
    public WebpOptions withSharpness(int sharpness) {
        this.sharpness = Math.max(0, Math.min(7, sharpness));
        return this;
    }
    
    /**
     * Set noise filter level (0-100)
     * Higher values result in more noise reduction
     * @param strength noise filter strength (0-100)
     * @return this options object for chaining
     */
    public WebpOptions withNoiseFilter(int strength) {
        this.noiseFilter = validateQuality(strength);
        return this;
    }
    
    /**
     * Create a preset for maximum compression with acceptable quality
     * @return a new WebpOptions object for maximum compression
     */
    public static WebpOptions presetCompression() {
        return new WebpOptions()
            .withQuality(50)
            .withNoiseFilter(30);
    }
    
    /**
     * Create a preset for maximum quality
     * @return a new WebpOptions object for maximum quality
     */
    public static WebpOptions presetHighQuality() {
        return new WebpOptions()
            .withQuality(95)
            .withAlphaQuality(100)
            .withSharpness(3);
    }
    
    /**
     * Create a preset for lossless compression (best for screenshots, text, icons)
     * @return a new WebpOptions object for lossless compression
     */
    public static WebpOptions presetLossless() {
        return new WebpOptions()
            .withLossless(true)
            .withExact(true);
    }
    
    /**
     * Create a preset for photos and natural images
     * @return a new WebpOptions object optimized for photos
     */
    public static WebpOptions presetPhoto() {
        return new WebpOptions()
            .withQuality(85)
            .withNoiseFilter(10)
            .withSharpness(2);
    }

    /**
     * Get the compression quality
     * @return quality value (0-100)
     */
    public int getQuality() {
        return quality;
    }

    /**
     * Get the alpha quality
     * @return alpha quality value (0-100)
     */
    public int getAlphaQuality() {
        return alphaQuality;
    }

    /**
     * Check if lossless mode is enabled
     * @return true if lossless mode is enabled
     */
    public boolean isLossless() {
        return lossless;
    }

    /**
     * Check if low memory mode is enabled
     * @return true if low memory mode is enabled
     */
    public boolean isLowMemory() {
        return lowMemory;
    }

    /**
     * Check if exact mode is enabled
     * @return true if exact mode is enabled
     */
    public boolean isExact() {
        return exact;
    }

    /**
     * Get the target resize width
     * @return target width (0 means preserve aspect ratio)
     */
    public int getWidth() {
        return width;
    }

    /**
     * Get the target resize height
     * @return target height (0 means preserve aspect ratio)
     */
    public int getHeight() {
        return height;
    }

    /**
     * Get the crop X position
     * @return x-coordinate of top-left corner of crop
     */
    public int getCropX() {
        return cropX;
    }

    /**
     * Get the crop Y position
     * @return y-coordinate of top-left corner of crop
     */
    public int getCropY() {
        return cropY;
    }

    /**
     * Get the crop width
     * @return width of crop region
     */
    public int getCropWidth() {
        return cropWidth;
    }

    /**
     * Get the crop height
     * @return height of crop region
     */
    public int getCropHeight() {
        return cropHeight;
    }

    /**
     * Get the sharpness filter level
     * @return sharpness level (0-7)
     */
    public int getSharpness() {
        return sharpness;
    }

    /**
     * Get the noise filter level
     * @return noise filter strength (0-100)
     */
    public int getNoiseFilter() {
        return noiseFilter;
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("WebpOptions{");
        if (lossless) {
            sb.append("mode=lossless");
        } else {
            sb.append("quality=").append(quality);
        }
        
        if (alphaQuality != 100) {
            sb.append(", alphaQuality=").append(alphaQuality);
        }
        
        if (width > 0 || height > 0) {
            sb.append(", resize=").append(width).append("x").append(height);
        }
        
        if (cropWidth > 0 && cropHeight > 0) {
            sb.append(", crop=(").append(cropX).append(",").append(cropY)
              .append(",").append(cropWidth).append("x").append(cropHeight).append(")");
        }
        
        if (sharpness > 0) {
            sb.append(", sharpness=").append(sharpness);
        }
        
        if (noiseFilter > 0) {
            sb.append(", noiseFilter=").append(noiseFilter);
        }
        
        if (exact) {
            sb.append(", exact=true");
        }
        
        if (lowMemory) {
            sb.append(", lowMemory=true");
        }
        
        sb.append("}");
        return sb.toString();
    }
}
