plugins {
	java
	id("org.springframework.boot") version "3.1.5"
	id("io.spring.dependency-management") version "1.1.3"
}

group = "shadowshift.studio"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenCentral()
}

// Версия Spring Cloud - исправленное объявление
val springCloudVersion by extra("2022.0.4")

dependencies {
	// Spring Boot и Spring Cloud Gateway
	implementation("org.springframework.boot:spring-boot-starter-webflux")
	implementation("org.springframework.cloud:spring-cloud-starter-gateway")
	
	// Добавляем зависимость для Redis RateLimiter
	implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
	
	// Spring Boot Actuator для мониторинга
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	
	// Lombok для уменьшения шаблонного кода
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	
	// Spring Security для защиты API
	implementation("org.springframework.boot:spring-boot-starter-security")
	
	// Swagger для документации API
	implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.1.0")
	
	// Валидация
	implementation("org.springframework.boot:spring-boot-starter-validation")
	
	// Добавляем Resilience4j для поддержки Circuit Breaker
	implementation("org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j")
	implementation("io.github.resilience4j:resilience4j-spring-boot3")
	implementation("io.github.resilience4j:resilience4j-reactor")
	
	// Consul для дискавери сервиса (по желанию)
	// implementation("org.springframework.cloud:spring-cloud-starter-consul-discovery")
	
	// Конфигурация
	implementation("org.springframework.boot:spring-boot-configuration-processor")
	
	// Тесты
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("io.projectreactor:reactor-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// Импорт управления зависимостями Spring Cloud
dependencyManagement {
	imports {
		mavenBom("org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}")
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}
