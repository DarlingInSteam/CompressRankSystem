package com.shadowshiftstudio.compressionservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Конфигурация CORS для разрешения кросс-доменных запросов
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Разрешаем запросы с localhost:3000 (фронтенд)
        config.addAllowedOrigin("http://localhost:3000");
        // Разрешаем все заголовки
        config.addAllowedHeader("*");
        // Разрешаем все HTTP-методы (GET, POST, PUT, DELETE и т.д.)
        config.addAllowedMethod("*");
        // Разрешаем отправку cookie с запросами
        config.setAllowCredentials(true);
        
        // Применяем конфигурацию ко всем путям
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}