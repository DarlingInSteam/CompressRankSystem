package com.shadowshiftstudio.compressionservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.support.converter.ClassMapper;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.shadowshiftstudio.compressionservice.dto.message.ImageMessage;
import com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage;
import com.shadowshiftstudio.compressionservice.messaging.ImageMessageListener;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    // Exchange names
    public static final String IMAGE_EXCHANGE = "image-exchange";
    
    // Routing keys
    public static final String STORAGE_KEY = "image.storage";
    public static final String COMPRESSION_KEY = "image.compression";
    
    // Queue names
    public static final String STORAGE_QUEUE = "image-storage-queue";
    public static final String COMPRESSION_QUEUE = "image-compression-queue";

    @Bean
    public TopicExchange imageExchange() {
        return new TopicExchange(IMAGE_EXCHANGE);
    }

    @Bean
    public Queue compressionQueue() {
        return new Queue(COMPRESSION_QUEUE);
    }

    @Bean
    public Binding compressionBinding(Queue compressionQueue, TopicExchange imageExchange) {
        return BindingBuilder.bind(compressionQueue).to(imageExchange).with(COMPRESSION_KEY);
    }

    @Bean
    public ClassMapper classMapper() {
        DefaultClassMapper classMapper = new DefaultClassMapper();
        Map<String, Class<?>> idClassMapping = new HashMap<>();
        
        // Настраиваем маппинг типов для корректной десериализации сообщений из ImageStorageService
        idClassMapping.put("shadowshift.studio.imagestorage.dto.message.ImageMessage", ImageMessage.class);
        idClassMapping.put("shadowshift.studio.imagestorage.dto.message.CompressionMessage", CompressionMessage.class);
        
        // Добавляем маппинг для собственных типов сообщений (для полноты)
        idClassMapping.put("com.shadowshiftstudio.compressionservice.dto.message.ImageMessage", ImageMessage.class);
        idClassMapping.put("com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage", CompressionMessage.class);
        
        classMapper.setIdClassMapping(idClassMapping);
        
        // Добавляем доверенные пакеты для десериализации
        classMapper.setTrustedPackages(new String[] {
            "shadowshift.studio.imagestorage.dto.message",
            "com.shadowshiftstudio.compressionservice.dto.message",
            "java.util",
            "java.lang"
        });
        
        return classMapper;
    }

    @Bean
    public MessageConverter jsonMessageConverter(ClassMapper classMapper) {
        ObjectMapper mapper = new ObjectMapper();
        
        // Регистрируем наши классы сообщений
        mapper.registerSubtypes(
                new NamedType(ImageMessage.class, "com.shadowshiftstudio.compressionservice.dto.message.ImageMessage"),
                new NamedType(CompressionMessage.class, "com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage")
        );
        
        // Создаем конвертер с настроенным мапером
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(mapper);
        
        // Устанавливаем маппер классов
        converter.setClassMapper(classMapper);
        
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
    
    /**
     * Создаем собственный контейнер для прослушивания сообщений,
     * который будет использовать ImageMessageListener напрямую вместо стандартного подхода
     */
    @Bean
    public SimpleMessageListenerContainer messageListenerContainer(
            ConnectionFactory connectionFactory, 
            ImageMessageListener messageListener) {
        
        SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.setQueueNames(COMPRESSION_QUEUE);
        container.setMessageListener(messageListener);
        
        // Отключаем автоматическую десериализацию сообщений
        container.setAutoStartup(true);
        return container;
    }
}