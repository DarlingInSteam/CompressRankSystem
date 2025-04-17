package shadowshift.studio.authservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import shadowshift.studio.authservice.service.UserService;

@SpringBootApplication
public class AuthServiceApplication {

    @Autowired
    private UserService userService;

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner initializer() {
        return args -> {
            // Initialize default admin user if no users exist
            userService.initializeDefaultAdmin();
        };
    }
}
