package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Специализированный фильтр для обработки предварительных CORS запросов (OPTIONS).
 * 
 * ВАЖНО: Данный класс отключен, так как основная CORS конфигурация
 * перемещена в SecurityConfig для предотвращения конфликтов и дублирования
 * заголовков CORS. Это решает проблему с "Invalid CORS request".
 */
@Configuration
@ConditionalOnProperty(name = "app.cors.use-preflight-filter", havingValue = "true", matchIfMissing = false)
public class GatewayCorsPreflight {

    private static final String ALLOWED_HEADERS = "Origin, Content-Type, Accept, Authorization, Access-Control-Request-Method, Access-Control-Request-Headers, X-Requested-With";
    private static final String ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
    private static final String ALLOWED_ORIGIN = "http://localhost:3000";
    private static final String EXPOSED_HEADERS = "Authorization, Content-Disposition";
    private static final String MAX_AGE = "3600"; // 1 hour

    /**
     * Этот фильтр отключен, поскольку современная конфигурация CORS
     * находится в SecurityConfig с использованием CorsWebFilter
     */
    @Bean
    @ConditionalOnProperty(name = "app.cors.use-preflight-filter", havingValue = "true", matchIfMissing = false)
    public WebFilter corsPreflightFilter() {
        return (ServerWebExchange exchange, WebFilterChain chain) -> {
            // Конфигурация отключена, просто передаем запрос дальше
            return chain.filter(exchange);
        };
    }
}