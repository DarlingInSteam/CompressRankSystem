package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * Конфигурация безопасности для API Gateway.
 * Настраивает политики доступа, CORS и другие аспекты безопасности для маршрутизации запросов.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /**
     * Настраивает цепочку фильтров безопасности для API Gateway.
     * Отключает CSRF и настраивает доступ к различным API эндпоинтам.
     *
     * @param http конфигуратор HTTP безопасности
     * @return сконфигурированная цепочка фильтров безопасности
     */
    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(auth -> {
                    // Открытый доступ к API документации
                    auth.pathMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/webjars/**").permitAll();
                    // Открытый доступ к эндпоинтам для мониторинга здоровья и метрик
                    auth.pathMatchers("/actuator/health/**", "/actuator/info").permitAll();
                    // Открытый доступ к fallback эндпоинтам
                    auth.pathMatchers("/fallback/**").permitAll();
                    // Открытый доступ к API эндпоинтам для данного проекта
                    // В реальном продакшене следует настроить аутентификацию
                    auth.pathMatchers("/api/**").permitAll();
                    // Все остальные запросы требуют аутентификации
                    auth.anyExchange().authenticated();
                })
                .build();
    }

    /**
     * Создаем корс-фильтр, который будет использовать объект CorsConfiguration
     * сгенерированный методом corsConfigurationSource
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        return new CorsWebFilter(corsConfigurationSource());
    }

    /**
     * Настраивает источник конфигурации CORS для API Gateway.
     * Определяет разрешенные источники, методы и заголовки.
     * 
     * Исправлено: настроены конкретные разрешенные источники и предотвращение
     * дублирования заголовков CORS
     *
     * @return источник конфигурации CORS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Используем Collections.singletonList вместо Arrays.asList
        // чтобы гарантировать только один допустимый источник
        config.setAllowedOrigins(Collections.singletonList("http://localhost:3000"));
        
        // Разрешить использование учетных данных (cookies и др.)
        config.setAllowCredentials(true);
        
        // Разрешенные методы HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Разрешенные заголовки
        config.setAllowedHeaders(Arrays.asList(
                "Origin", 
                "Content-Type", 
                "Accept", 
                "Authorization",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With"
        ));
        
        // Срок действия предварительных запросов (preflight)
        config.setMaxAge(3600L);
        
        // Заголовки, которые могут быть прочитаны клиентом
        config.setExposedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Disposition"
        ));
        
        // Применение конфигурации ко всем путям
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return source;
    }
}
