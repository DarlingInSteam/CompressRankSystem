package shadowshift.studio.statisticsranking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StatisticsRankingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(StatisticsRankingServiceApplication.class, args);
    }
}