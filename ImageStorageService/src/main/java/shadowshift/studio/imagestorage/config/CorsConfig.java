package shadowshift.studio.imagestorage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS configuration for ImageStorageService.
 * 
 * CORS handling is now completely disabled in microservices to prevent duplicate headers.
 * All CORS handling is delegated to the API Gateway.
 */
@Configuration
public class CorsConfig {

    // Removed @Bean annotation to prevent this filter from being registered
    // This method can stay as documentation but won't be used by Spring
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(false);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}