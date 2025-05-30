package shadowshift.studio.apigatewaycompressionranksystem.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
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
        exchange.getAttributes().put(REQUEST_START_TIME, System.currentTimeMillis());
        
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
        
        final String finalRequestId = requestId;
        
        logger.info("Incoming request: {} {} from {} [request_id: {}]", 
                method, path, sourceIp, finalRequestId);
                
        // Log request headers for debugging
        HttpHeaders headers = request.getHeaders();
        logger.debug("Request headers: {}", headers);
        
        // Log request body for POST/PUT requests to help debug request parsing issues
        if (method.equals("POST") || method.equals("PUT")) {
            if (path.contains("/api/manga")) {
                // Create final reference to exchange for use in lambda
                final ServerWebExchange finalExchange = exchange;
                final GatewayFilterChain finalChain = chain;
                
                return DataBufferUtils.join(finalExchange.getRequest().getBody())
                    .flatMap(dataBuffer -> {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(bytes);
                        String bodyString = new String(bytes, StandardCharsets.UTF_8);
                        logger.info("Request body for {}: {}", path, bodyString);
                        
                        // Restore the request body
                        final ServerHttpRequest mutatedRequest = new ServerHttpRequestDecorator(finalExchange.getRequest()) {
                            @Override
                            public Flux<DataBuffer> getBody() {
                                return Flux.just(finalExchange.getResponse().bufferFactory().wrap(bytes));
                            }
                        };
                        return finalChain.filter(finalExchange.mutate().request(mutatedRequest).build());
                    });
            }
        }
        
        ServerWebExchange finalExchange = exchange;
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            final Long startTime = finalExchange.getAttribute(REQUEST_START_TIME);
            if (startTime != null) {
                final long duration = System.currentTimeMillis() - startTime;
                
                final int statusCode = finalExchange.getResponse().getStatusCode() != null
                        ? finalExchange.getResponse().getStatusCode().value()
                        : 0;
                
                logger.info("Completed request: {} {} - {} in {} ms [request_id: {}]",
                        method, path, statusCode, duration, finalRequestId);
            }
        }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}