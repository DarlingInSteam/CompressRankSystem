package shadowshift.studio.apigatewaycompressionranksystem.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.OrderedGatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Фильтр для преобразования запросов к манга API.
 * Обеспечивает правильную обработку JSON данных.
 */
@Component
public class MangaRequestTransformer extends AbstractGatewayFilterFactory<MangaRequestTransformer.Config> {

    private static final Logger logger = LoggerFactory.getLogger(MangaRequestTransformer.class);
    
    public MangaRequestTransformer() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return new OrderedGatewayFilter((exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // Проверяем, что это запрос к API манги и с JSON данными
            if (request.getPath().toString().contains("/api/manga") && 
                    isJsonRequest(request)) {
                
                logger.debug("Processing manga request path: {}", request.getPath());
                
                return DataBufferUtils.join(request.getBody())
                    .flatMap(dataBuffer -> {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(bytes);
                        String bodyString = new String(bytes, StandardCharsets.UTF_8);
                        
                        // Log for debugging but don't modify the request body
                        logger.trace("Request body: {}", bodyString);
                        
                        // Just ensure content type is set correctly without modifying the body
                        DataBufferFactory factory = exchange.getResponse().bufferFactory();
                        DataBuffer newDataBuffer = factory.wrap(bytes);
                        
                        ServerHttpRequest mutatedRequest = new ServerHttpRequestDecorator(request) {
                            @Override
                            public Flux<DataBuffer> getBody() {
                                return Flux.just(newDataBuffer);
                            }
                            
                            @Override
                            public HttpHeaders getHeaders() {
                                HttpHeaders httpHeaders = new HttpHeaders();
                                httpHeaders.putAll(super.getHeaders());
                                
                                // Ensure content type is set properly
                                if (!httpHeaders.containsKey(HttpHeaders.CONTENT_TYPE)) {
                                    httpHeaders.setContentType(MediaType.APPLICATION_JSON);
                                }
                                
                                // Update content length if needed
                                httpHeaders.setContentLength(bytes.length);
                                
                                return httpHeaders;
                            }
                        };
                        
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    });
            }
            
            // Если не запрос к API манги, просто продолжаем цепочку
            return chain.filter(exchange);
        }, 1);
    }

    private boolean isJsonRequest(ServerHttpRequest request) {
        String contentType = request.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
        return contentType != null && contentType.contains(MediaType.APPLICATION_JSON_VALUE);
    }

    public static class Config {
        // Конфигурационные свойства, если потребуются
    }
}