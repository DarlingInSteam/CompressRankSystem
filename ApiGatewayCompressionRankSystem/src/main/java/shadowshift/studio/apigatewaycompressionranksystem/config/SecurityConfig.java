package shadowshift.studio.apigatewaycompressionranksystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.WebFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.reactive.CorsWebFilter;

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
                // Делаем CORS конфигурацию основной для всего приложения
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(auth -> {
                    // Разрешаем OPTIONS запросы для всех URL (нужно для preflight CORS)
                    auth.pathMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    
                    // Открытый доступ к API документации
                    auth.pathMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/webjars/**").permitAll();
                    // Открытый доступ к эндпоинтам для мониторинга здоровья и метрик
                    auth.pathMatchers("/actuator/health/**", "/actuator/info").permitAll();
                    // Открытый доступ к fallback эндпоинтам
                    auth.pathMatchers("/fallback/**").permitAll();
                    // Явное разрешение для эндпоинтов аутентификации
                    auth.pathMatchers("/api/auth/**").permitAll();
                    // Открытый доступ к API эндпоинтам для данного проекта
                    // В реальном продакшене следует настроить аутентификацию
                    auth.pathMatchers("/api/**").permitAll();
                    // Все остальные запросы требуют аутентификации
                    auth.anyExchange().authenticated();
                })
                .build();
    }

    /**
     * Основной источник CORS конфигурации для всего приложения.
     * Использует аннотацию @Primary для переопределения других бинов.
     */
    @Bean
    @Primary
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Разрешаем запросы только с frontend приложения
        config.setAllowedOrigins(Collections.singletonList("http://localhost:3000"));
        config.setAllowCredentials(true);
        
        // Разрешаем все необходимые HTTP методы
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        
        // Разрешаем все необходимые заголовки
        config.setAllowedHeaders(Arrays.asList(
                "Origin", 
                "Content-Type",
                "Accept", 
                "Authorization",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With",
                "X-Auth-Token",
                "X-User-Name",
                "X-User-Role",
                "X-User-Id",
                "Cache-Control",
                "Pragma"
        ));
        
        // Увеличиваем время кеширования результатов предварительной проверки CORS
        config.setMaxAge(3600L);
        
        // Указываем какие заголовки могут быть открыты для фронтенда
        config.setExposedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Disposition",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"
        ));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Применяем ко всем путям
        
        return source;
    }
    
    /**
     * Высокоприоритетный веб-фильтр для обеспечения правильной обработки CORS.
     * Применяется раньше всех других фильтров, чтобы гарантировать
     * добавление заголовков CORS до проверки безопасности.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public WebFilter corsFilter() {
        return new CorsWebFilter(corsConfigurationSource());
    }
}
