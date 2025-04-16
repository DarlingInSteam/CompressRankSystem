package shadowshift.studio.imagestorage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowedOriginPatterns(Collections.singletonList("*"));
        
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://localhost");
        config.addAllowedOrigin("http://localhost:80");
        config.addAllowedOrigin("http://admin-panel");
        
        config.setAllowCredentials(true);
        
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        config.setAllowedHeaders(Arrays.asList(
                "Origin", 
                "Content-Type", 
                "Accept", 
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With"
        ));
        
        config.setMaxAge(3600L);
        
        config.setExposedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Disposition"
        ));
        
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}