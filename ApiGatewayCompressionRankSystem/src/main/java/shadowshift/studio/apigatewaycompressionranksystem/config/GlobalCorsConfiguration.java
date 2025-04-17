package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.EnableWebFlux;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Глобальная конфигурация CORS для всего приложения.
 * Эта конфигурация обеспечивает правильную обработку CORS на уровне WebFlux,
 * дополняя настройки безопасности в SecurityConfig.
 * 
 * ВАЖНО: Данный класс отключен, так как основная CORS конфигурация
 * перемещена в SecurityConfig для предотвращения конфликтов и дублирования.
 */
@Configuration
@EnableWebFlux
@ConditionalOnProperty(name = "app.cors.use-legacy-config", havingValue = "true", matchIfMissing = false)
public class GlobalCorsConfiguration implements WebFluxConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Эта конфигурация отключена
        // Основная CORS конфигурация находится в SecurityConfig
    }
}