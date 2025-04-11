plugins {
	java
	id("org.springframework.boot") version "3.4.1-SNAPSHOT"
	id("io.spring.dependency-management") version "1.1.6"
}

group = "com.shadowshiftstudio"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(23)
	}
}

repositories {
	mavenCentral()
	maven { url = uri("https://repo.spring.io/snapshot") }
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-thymeleaf") // Добавляем Thymeleaf для шаблонизации
	implementation("io.minio:minio:8.5.9") // MinIO клиент
	implementation("org.imgscalr:imgscalr-lib:4.2") // Библиотека для работы с изображениями
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("commons-io:commons-io:2.15.1") // Утилиты для работы с файлами
	implementation("org.springframework.retry:spring-retry") // Добавляем Spring Retry
	implementation("org.springframework:spring-aspects") // Необходимо для работы аннотаций @Retryable

	// Зависимости для работы с базой данных
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("com.h2database:h2") // Используем H2 вместо PostgreSQL

	// Добавляем встроенный MinIO сервер для эмуляции
	implementation("de.bwaldvogel:mongo-java-server:1.44.0") // Помогает запустить встроенный сервер

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}