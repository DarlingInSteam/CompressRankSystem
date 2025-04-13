package com.shadowshiftstudio.compressionservice.util.webp;

/**
 * Exception thrown for WebP conversion errors
 */
public class CWebpException extends Exception {
    /**
     * Create a new exception with a message
     * @param message error message
     */
    public CWebpException(String message) {
        super(message);
    }

    /**
     * Create a new exception with a cause
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    public CWebpException(Throwable cause) {
        super(cause);
    }
    
    /**
     * Create a new exception with message and cause
     * @param message error message
     * @param cause the cause (which is saved for later retrieval by the getCause() method)
     */
    public CWebpException(String message, Throwable cause) {
        super(message, cause);
    }
    
    /**
     * Create a new exception with command and exit code
     * @param command the command that failed
     * @param exitCode the exit code returned by the process
     */
    public CWebpException(String command, int exitCode) {
        super("WebP conversion command failed with exit code " + exitCode + ": " + command);
    }
}
