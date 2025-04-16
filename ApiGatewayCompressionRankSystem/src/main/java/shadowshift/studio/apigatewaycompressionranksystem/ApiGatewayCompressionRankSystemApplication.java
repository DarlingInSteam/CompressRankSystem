package shadowshift.studio.apigatewaycompressionranksystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.servers.Server;

/**
 * Основной класс приложения API Gateway для системы CompressRank.
 * Выполняет роль маршрутизатора запросов между клиентами (админ-панелью) 
 * и микросервисами (сервисом хранения изображений и сервисом сжатия).
 */
@SpringBootApplication
@OpenAPIDefinition(
    info = @Info(
        title = "CompressRank API Gateway",
        version = "1.0",
        description = "API Gateway для системы управления и сжатия изображений CompressRank",
        contact = @Contact(
            name = "ShadowShift Studio",
            email = "contact@shadowshiftstudio.com",
            url = "https://shadowshiftstudio.com"
        ),
        license = @License(
            name = "Apache 2.0",
            url = "https://www.apache.org/licenses/LICENSE-2.0.html"
        )
    ),
    servers = {
        @Server(url = "http://localhost:8082", description = "Локальный сервер разработки"),
        @Server(url = "https://api.compressionservice.com", description = "Продакшн сервер")
    }
)
public class ApiGatewayCompressionRankSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayCompressionRankSystemApplication.class, args);
	}
}
