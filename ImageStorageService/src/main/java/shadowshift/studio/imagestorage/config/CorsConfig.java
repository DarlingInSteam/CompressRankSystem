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
        
        // Разрешаем все возможные источники запросов
        config.setAllowedOriginPatterns(Collections.singletonList("*"));
        
        // Разрешаем конкретные хосты, если нужно более строгое ограничение
        config.addAllowedOrigin("http://localhost:3000"); // Frontend в режиме разработки
        config.addAllowedOrigin("http://localhost"); // Frontend в Docker
        config.addAllowedOrigin("http://localhost:80"); // Frontend в Docker на явном порту
        config.addAllowedOrigin("http://admin-panel"); // Docker service name
        
        // Разрешаем учетные данные (cookies, заголовки аутентификации)
        config.setAllowCredentials(true);
        
        // Разрешаем все методы HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Разрешаем все заголовки
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
        
        // Устанавливаем время кэширования предварительных запросов CORS
        config.setMaxAge(3600L);
        
        // Определение заголовков, которые клиент может использовать в фактическом запросе
        config.setExposedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Disposition"
        ));
        
        // Применяем эту конфигурацию ко всем путям
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}