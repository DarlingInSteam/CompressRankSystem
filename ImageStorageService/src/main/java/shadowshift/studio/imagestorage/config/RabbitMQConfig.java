package shadowshift.studio.imagestorage.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchange for image operations
    public static final String IMAGE_EXCHANGE = "image-exchange";
    
    // Queues
    public static final String STORAGE_QUEUE = "image-storage-queue";
    public static final String COMPRESSION_QUEUE = "image-compression-queue";
    
    // Routing keys
    public static final String STORAGE_KEY = "image.storage";
    public static final String COMPRESSION_KEY = "image.compression";

    @Bean
    public TopicExchange imageExchange() {
        return new TopicExchange(IMAGE_EXCHANGE);
    }

    @Bean
    public Queue storageQueue() {
        return new Queue(STORAGE_QUEUE, true);
    }

    @Bean
    public Queue compressionQueue() {
        return new Queue(COMPRESSION_QUEUE, true);
    }

    @Bean
    public Binding storageBinding(Queue storageQueue, TopicExchange imageExchange) {
        return BindingBuilder.bind(storageQueue).to(imageExchange).with(STORAGE_KEY);
    }

    @Bean
    public Binding compressionBinding(Queue compressionQueue, TopicExchange imageExchange) {
        return BindingBuilder.bind(compressionQueue).to(imageExchange).with(COMPRESSION_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}