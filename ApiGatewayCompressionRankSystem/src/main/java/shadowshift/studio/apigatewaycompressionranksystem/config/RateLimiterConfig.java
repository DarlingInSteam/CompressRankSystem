package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

/**
 * Конфигурация ограничителя скорости запросов.
 * Предоставляет компоненты для регулирования количества запросов от клиентов.
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Создает резолвер ключей на основе IP-адреса.
     * Используется для идентификации источника запросов при применении ограничений.
     *
     * @return резолвер ключей для идентификации по IP
     */
    @Primary
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null ?
                    exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() :
                    "unknown";
            return Mono.just(ip);
        };
    }

    /**
     * Создает резолвер ключей на основе пути запроса.
     * Используется для разграничения лимитов между разными эндпоинтами.
     *
     * @return резолвер ключей для идентификации по пути
     */
    @Bean
    public KeyResolver pathKeyResolver() {
        return exchange -> Mono.just(exchange.getRequest().getPath().value());
    }

    /**
     * Создает резолвер ключей на основе заголовка авторизации.
     * Используется для идентификации пользователей по токену авторизации.
     *
     * @return резолвер ключей для идентификации по авторизационному заголовку
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.justOrEmpty(exchange.getRequest().getHeaders().getFirst("Authorization"))
                .defaultIfEmpty("anonymous");
    }
}