package shadowshift.studio.imagestorage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ImageStorageServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImageStorageServiceApplication.class, args);
    }
}