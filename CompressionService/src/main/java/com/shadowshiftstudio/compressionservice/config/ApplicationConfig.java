package com.shadowshiftstudio.compressionservice.config;

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
     * Создает и настраивает фильтр для логирования запросов.
     *
     * @return настроенный экземпляр CommonsRequestLoggingFilter
     */
    @Bean
    public CommonsRequestLoggingFilter requestLoggingFilter() {
        CommonsRequestLoggingFilter filter = new CommonsRequestLoggingFilter();
        filter.setIncludeQueryString(true);
        filter.setIncludePayload(true);
        filter.setMaxPayloadLength(10000);
        filter.setIncludeHeaders(false);
        return filter;
    }

    /**
     * Создает и настраивает конвертер сообщений для BufferedImage.
     *
     * @return экземпляр BufferedImageHttpMessageConverter
     */
    @Bean
    public BufferedImageHttpMessageConverter bufferedImageHttpMessageConverter() {
        return new BufferedImageHttpMessageConverter();
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