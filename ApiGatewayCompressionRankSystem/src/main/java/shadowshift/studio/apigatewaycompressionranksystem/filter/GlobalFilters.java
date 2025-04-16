package shadowshift.studio.apigatewaycompressionranksystem.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Глобальный фильтр для логирования запросов.
 * Добавляет уникальный идентификатор для отслеживания запросов и логирует входящие запросы.
 */
@Component
public class GlobalFilters implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(GlobalFilters.class);
    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String REQUEST_START_TIME = "requestStartTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Начало времени запроса для вычисления продолжительности
        exchange.getAttributes().put(REQUEST_START_TIME, System.currentTimeMillis());
        
        // Добавление уникального идентификатора запроса
        ServerHttpRequest request = exchange.getRequest();
        final String method = request.getMethod().name();
        final String path = request.getPath().value();
        final String sourceIp = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "unknown";
        
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
            request = exchange.getRequest().mutate()
                    .header(REQUEST_ID_HEADER, requestId)
                    .build();
            exchange = exchange.mutate().request(request).build();
        }
        
        // Важно: делаем переменную final для использования в лямбда-выражении
        final String finalRequestId = requestId;
        
        // Логирование входящего запроса
        logger.info("Incoming request: {} {} from {} [request_id: {}]", 
                method, path, sourceIp, finalRequestId);
        
        // Продолжение цепочки фильтров и логирование после завершения запроса
        ServerWebExchange finalExchange = exchange;
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            // Получаем время начала запроса из атрибутов
            final Long startTime = finalExchange.getAttribute(REQUEST_START_TIME);
            if (startTime != null) {
                final long duration = System.currentTimeMillis() - startTime;
                
                // Получаем статус ответа
                final int statusCode = finalExchange.getResponse().getStatusCode() != null
                        ? finalExchange.getResponse().getStatusCode().value()
                        : 0;
                
                // Логируем завершение запроса
                logger.info("Completed request: {} {} - {} in {} ms [request_id: {}]",
                        method, path, statusCode, duration, finalRequestId);
            }
        }));
    }

    @Override
    public int getOrder() {
        // Высокий приоритет выполнения (выполняется раньше)
        return Ordered.HIGHEST_PRECEDENCE;
    }
}