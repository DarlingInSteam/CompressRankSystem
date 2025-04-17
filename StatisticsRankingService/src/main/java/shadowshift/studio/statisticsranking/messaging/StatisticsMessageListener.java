package shadowshift.studio.statisticsranking.messaging;

import shadowshift.studio.statisticsranking.service.ImageStatisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class StatisticsMessageListener {
    
    private static final Logger logger = LoggerFactory.getLogger(StatisticsMessageListener.class);
    
    private final ImageStatisticsService statisticsService;
    
    @Autowired
    public StatisticsMessageListener(ImageStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }
    
    @RabbitListener(queues = "${queue.image.statistics}")
    public void processStatisticsMessage(StatisticsEvent event) {
        logger.debug("Received statistics event: {} for image ID: {}", event.getEventType(), event.getImageId());
        
        try {
            switch (event.getEventType()) {
                case VIEW:
                    statisticsService.incrementViewCount(event.getImageId());
                    logger.debug("Incremented view count for image: {}", event.getImageId());
                    break;
                case DOWNLOAD:
                    statisticsService.incrementDownloadCount(event.getImageId());
                    logger.debug("Incremented download count for image: {}", event.getImageId());
                    break;
                default:
                    logger.warn("Unknown event type received: {}", event.getEventType());
            }
        } catch (Exception e) {
            logger.error("Error processing statistics event: {}", e.getMessage(), e);
        }
    }
}