package shadowshift.studio.imagestorage.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.ClassMapper;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String IMAGE_EXCHANGE = "image-exchange";
    
    public static final String STORAGE_KEY = "image.storage";
    public static final String COMPRESSION_KEY = "image.compression";
    
    public static final String STORAGE_QUEUE = "image-storage-queue";
    public static final String COMPRESSION_QUEUE = "image-compression-queue";

    @Bean
    public TopicExchange imageExchange() {
        return new TopicExchange(IMAGE_EXCHANGE);
    }

    @Bean
    public Queue storageQueue() {
        return new Queue(STORAGE_QUEUE);
    }

    @Bean
    public Binding storageBinding(Queue storageQueue, TopicExchange imageExchange) {
        return BindingBuilder.bind(storageQueue).to(imageExchange).with(STORAGE_KEY);
    }

    @Bean
    public ClassMapper classMapper() {
        DefaultClassMapper classMapper = new DefaultClassMapper();
        Map<String, Class<?>> idClassMapping = new HashMap<>();
        
        idClassMapping.put("com.shadowshiftstudio.compressionservice.dto.message.ImageMessage",
                         shadowshift.studio.imagestorage.dto.message.ImageMessage.class);
        idClassMapping.put("com.shadowshiftstudio.compressionservice.dto.message.CompressionMessage", 
                         shadowshift.studio.imagestorage.dto.message.CompressionMessage.class);
        
        classMapper.setIdClassMapping(idClassMapping);
        
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
        
        mapper.registerSubtypes(new NamedType(shadowshift.studio.imagestorage.dto.message.ImageMessage.class,
                "com.shadowshiftstudio.compressionservice.dto.message.ImageMessage"));
        
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(mapper);
        
        converter.setClassMapper(classMapper);
        
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}