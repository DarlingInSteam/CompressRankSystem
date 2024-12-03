package com.shadowshiftstudio.compressionservice.config;

import com.shadowshiftstudio.compressionservice.filter.RequestLoggingFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.BufferedImageHttpMessageConverter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.CommonsRequestLoggingFilter;

import javax.imageio.ImageIO;

/**
 * Конфигурационный класс для настройки компонентов приложения.
 */
@Configuration
public class ApplicationConfig {
    /**
     * Создает и настраивает конвертер сообщений для BufferedImage.
     *
     * @return экземпляр BufferedImageHttpMessageConverter
     */
    @Bean
    public BufferedImageHttpMessageConverter bufferedImageHttpMessageConverter() {
        return new BufferedImageHttpMessageConverter();
    }

    @Bean(name = "requestLoggingFilter") // Явно задаем имя бина
    public RequestLoggingFilter requestLoggingFilter() {
        return new RequestLoggingFilter();
    }

    /**
     * Создает и настраивает RestTemplate для выполнения HTTP-запросов.
     *
     * @return экземпляр RestTemplate
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}