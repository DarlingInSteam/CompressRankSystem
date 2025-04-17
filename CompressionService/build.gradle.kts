plugins {
	java
	id("org.springframework.boot") version "3.4.1-SNAPSHOT"
	id("io.spring.dependency-management") version "1.1.6"
}

group = "com.shadowshiftstudio"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

// Add compiler options to preserve parameter names
tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}

repositories {
	mavenCentral()
	maven { url = uri("https://repo.spring.io/snapshot") }
	
	// Добавляем локальный репозиторий Maven для WebpConverter
	flatDir {
		dirs("libs")
	}
}

// Задача для копирования WebpConverter.jar в директорию libs
tasks.register<Copy>("copyWebpConverterJar") {
    from(layout.projectDirectory.dir("../WebpConverter/build/libs"))
    include("WebpConverter-1.0-SNAPSHOT.jar")
    into(layout.projectDirectory.dir("libs"))
    doLast {
        println("WebpConverter JAR скопирован в директорию libs")
    }
}

// Выполняем копирование перед компиляцией
tasks.named("compileJava") {
    dependsOn("copyWebpConverterJar")
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
	
	// Добавляем WebpConverter как локальную файловую зависимость вместо Maven артефакта
	implementation(files("libs/WebpConverter-1.0-SNAPSHOT.jar"))

	// Документация API (Swagger/OpenAPI)
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")

	// Зависимости для работы с базой данных
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.postgresql:postgresql") // PostgreSQL вместо H2
	
	// Оставляем H2 для тестирования
	testImplementation("com.h2database:h2")

	// Добавляем встроенный MinIO сервер для эмуляции
	implementation("de.bwaldvogel:mongo-java-server:1.44.0") // Помогает запустить встроенный сервер

	implementation("org.springframework.boot:spring-boot-starter-amqp")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}