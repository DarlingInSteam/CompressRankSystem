FROM openjdk:17-jdk-slim as build

WORKDIR /app

# Копирование Gradle файлов и скриптов
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./

# Исправляем права доступа для gradlew
RUN chmod +x ./gradlew

# Загрузка зависимостей
RUN ./gradlew dependencies --no-daemon

# Копирование исходного кода
COPY src src

# Сборка проекта
RUN ./gradlew build -x test --no-daemon

# Конечный образ
FROM openjdk:17-jdk-slim

WORKDIR /app

# Устанавливаем зависимости для работы приложения
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Копирование JAR из сборочного образа
COPY --from=build /app/build/libs/*.jar app.jar

# Переменные окружения (значения по умолчанию)
ENV IMAGE_STORAGE_SERVICE_URL=http://image-storage-service:8081
ENV COMPRESSION_SERVICE_URL=http://compression-service:8080

# Порт приложения
EXPOSE 8082

# Запуск приложения
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# Метаданные для контейнера
LABEL maintainer="ShadowShift Studio <contact@shadowshiftstudio.com>"
LABEL version="1.0"
LABEL description="API Gateway для системы CompressRank"

# Проверка работоспособности
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -f http://localhost:8082/actuator/health || exit 1