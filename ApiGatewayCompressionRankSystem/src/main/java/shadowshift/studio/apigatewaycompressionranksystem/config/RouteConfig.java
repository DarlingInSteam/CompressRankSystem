package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Конфигурация маршрутов API Gateway.
 * Определяет программными методами маршруты для перенаправления запросов к микросервисам.
 * Дополняет конфигурацию, определенную в application.yml.
 */
@Configuration
public class RouteConfig {

    @Value("${IMAGE_STORAGE_SERVICE_URL:http://localhost:8081}")
    private String imageStorageServiceUrl;

    @Value("${COMPRESSION_SERVICE_URL:http://localhost:8080}")
    private String compressionServiceUrl;

    /**
     * Настраивает программно дополнительные маршруты для API Gateway.
     * Демонстрирует возможности программной конфигурации маршрутов для более сложной логики.
     *
     * @param builder построитель маршрутов
     * @return настроенный локатор маршрутов
     */
    @Bean
    public RouteLocator additionalRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                // Маршрут для объединения данных метрик от обоих сервисов (пример агрегации)
                .route("aggregated-metrics", r -> r
                        .path("/api/metrics/aggregated")
                        .filters(f -> f
                                .rewritePath("/api/metrics/aggregated", "/api/metrics")
                                .circuitBreaker(config -> config
                                        .setName("metricsCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/metrics"))
                                .retry(retry -> retry
                                        .setRetries(3)
                                        .setMethods(HttpMethod.GET)
                                        .setBackoff(Duration.ofMillis(50), Duration.ofMillis(500), 2, true))
                        )
                        .uri(imageStorageServiceUrl)
                )
                
                // Маршрут для проверки статуса всех сервисов
                .route("system-health", r -> r
                        .path("/api/system/health")
                        .filters(f -> f.setResponseHeader("X-Response-Source", "API Gateway"))
                        .uri("forward:/actuator/health")
                )
                
                // Маршрут для обработки загруженных файлов с метаданными
                .route("upload-with-metadata", r -> r
                        .path("/api/upload/with-metadata")
                        .and()
                        .method(HttpMethod.POST)
                        .filters(f -> f
                                .rewritePath("/api/upload/with-metadata", "/api/images")
                                .addRequestHeader("X-Processed-By", "gateway")
                                .retry(3)
                        )
                        .uri(imageStorageServiceUrl)
                )
                
                // Дополнительный маршрут для обработки ошибок
                .route("fallback-routes", r -> r
                        .path("/fallback/**")
                        .filters(f -> f.setResponseHeader("X-Fallback", "true"))
                        .uri("forward:/internal/fallback")
                )
                .build();
    }
}