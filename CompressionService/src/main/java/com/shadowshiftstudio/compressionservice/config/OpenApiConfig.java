package com.shadowshiftstudio.compressionservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Сервис сжатия изображений")
                        .description("API для сжатия изображений с различными уровнями компрессии")
                        .version("1.0")
                        .contact(new Contact()
                                .name("ShadowShift Studio")
                                .email("contact@shadowshiftstudio.com")
                                .url("https://shadowshiftstudio.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Локальный сервер"),
                        new Server().url("https://api.compression-service.com").description("Рабочий сервер")
                ));
    }
}