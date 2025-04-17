plugins {
	java
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "shadowshift.studio"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

// Configure Spring Boot main class
springBoot {
    mainClass.set("shadowshift.studio.imagestorage.ImageStorageServiceApplication")
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.postgresql:postgresql") // PostgreSQL вместо H2
	
	// Оставляем H2 для тестирования
	testImplementation("com.h2database:h2")
	
	implementation("io.minio:minio:8.5.4")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.4.0")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	
	// Message broker: RabbitMQ
	implementation("org.springframework.boot:spring-boot-starter-amqp")
	
	// JSON serialization for Java 8 Date/Time API
	implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
	
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
