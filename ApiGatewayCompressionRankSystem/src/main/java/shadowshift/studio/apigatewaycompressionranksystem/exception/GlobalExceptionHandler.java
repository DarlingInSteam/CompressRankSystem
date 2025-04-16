package shadowshift.studio.apigatewaycompressionranksystem.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Глобальный обработчик исключений для API Gateway.
 * Перехватывает исключения и возвращает структурированный JSON-ответ.
 */
@Component
@Order(-2) // Высокий приоритет для перехвата до стандартных обработчиков
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        
        // Устанавливаем соответствующий статус ответа в зависимости от типа исключения
        HttpStatus status;
        String errorMessage;
        String errorCode;
        
        if (ex instanceof ResponseStatusException) {
            ResponseStatusException responseStatusException = (ResponseStatusException) ex;
            // Исправляем: преобразуем HttpStatusCode в HttpStatus
            status = HttpStatus.valueOf(responseStatusException.getStatusCode().value());
            errorMessage = responseStatusException.getMessage();
            errorCode = "API_ERROR";
        } else if (ex instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            errorMessage = "Запрашиваемый сервис не найден";
            errorCode = "SERVICE_NOT_FOUND";
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = "Внутренняя ошибка сервера";
            errorCode = "INTERNAL_ERROR";
        }
        
        // Получаем и обрабатываем путь запроса для лога
        final String requestPath = exchange.getRequest().getPath().value();
        
        // Логируем информацию об ошибке
        logger.error("Gateway Exception: status={}, path={}, error={}", 
                status, requestPath, ex.getMessage(), ex);
        
        // Устанавливаем статус ответа
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        // Создаем JSON-ответ с информацией об ошибке
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", errorMessage);
        errorResponse.put("code", errorCode);
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("path", requestPath);
        
        // Преобразуем ответ в JSON и отправляем
        String jsonResponse;
        try {
            StringBuilder builder = new StringBuilder();
            builder.append("{");
            builder.append("\"status\":\"error\",");
            builder.append("\"message\":\"").append(errorMessage.replace("\"", "\\\"")).append("\",");
            builder.append("\"code\":\"").append(errorCode).append("\",");
            builder.append("\"timestamp\":").append(System.currentTimeMillis()).append(",");
            builder.append("\"path\":\"").append(requestPath).append("\"");
            builder.append("}");
            jsonResponse = builder.toString();
        } catch (Exception e) {
            jsonResponse = "{\"status\":\"error\",\"message\":\"Внутренняя ошибка сервера\",\"code\":\"ERROR_RESPONSE_PROCESSING\"}";
            logger.error("Ошибка при формировании JSON-ответа", e);
        }
        
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        
        return response.writeWith(Mono.just(buffer));
    }
}