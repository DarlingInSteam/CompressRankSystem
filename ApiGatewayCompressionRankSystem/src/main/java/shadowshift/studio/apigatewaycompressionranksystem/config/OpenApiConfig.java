package shadowshift.studio.apigatewaycompressionranksystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Конфигурация API документации (Swagger/OpenAPI).
 * Настраивает информацию о документации API, включая контактные данные, лицензию и серверы.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Создает конфигурацию OpenAPI для документации API Gateway.
     *
     * @param gatewayHost хост API Gateway, задается в конфигурации
     * @return объект конфигурации OpenAPI
     */
    @Bean
    public OpenAPI apiGatewayOpenApi(
            @Value("${gateway.host:localhost:8082}") String gatewayHost,
            @Value("${compression.service.host:localhost:8080}") String compressionHost,
            @Value("${image.storage.service.host:localhost:8081}") String storageHost) {
        
        return new OpenAPI()
                .info(new Info()
                        .title("CompressRank API Gateway")
                        .description("API Gateway для системы управления и сжатия изображений CompressRank")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ShadowShift Studio")
                                .email("contact@shadowshiftstudio.com")
                                .url("https://shadowshiftstudio.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html"))
                        .termsOfService("https://shadowshiftstudio.com/terms"))
                .servers(List.of(
                        new Server()
                                .url("http://" + gatewayHost)
                                .description("API Gateway"),
                        new Server()
                                .url("http://" + compressionHost)
                                .description("Сервис сжатия (прямой доступ)"),
                        new Server()
                                .url("http://" + storageHost)
                                .description("Сервис хранения изображений (прямой доступ)")
                ));
    }
}