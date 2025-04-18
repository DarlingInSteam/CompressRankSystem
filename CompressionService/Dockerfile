FROM eclipse-temurin:21-jdk as build
WORKDIR /workspace/app

# Copy gradle configuration files
COPY gradle gradle
COPY gradlew .
COPY settings.gradle.kts .
COPY build.gradle.kts .
COPY src src

# Set JAVA_HOME explicitly to Java 21
ENV JAVA_HOME=/opt/java/openjdk

# Make gradlew executable
RUN chmod +x ./gradlew

# Create a gradle properties file that forces Java 21
RUN mkdir -p /root/.gradle && \
    echo "org.gradle.java.home=/opt/java/openjdk" > /root/.gradle/gradle.properties

# Build the application with explicit Java and Gradle configuration
RUN ./gradlew bootJar --no-daemon -Dorg.gradle.java.home=/opt/java/openjdk

FROM eclipse-temurin:21-jre
VOLUME /tmp

# Install WebP tools and its dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    webp \
    libwebp-dev \
    libgdiplus \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create directory for webp binaries
RUN mkdir -p /app/webp_binaries && \
    cp /usr/bin/cwebp /app/webp_binaries/ && \
    chmod +x /app/webp_binaries/cwebp

# Set environment variable for WebP binary path
ENV WEBP_BINARY_PATH=/app/webp_binaries/cwebp

# Create data directory
RUN mkdir -p /app/data

# Copy the built jar file
COPY --from=build /workspace/app/build/libs/*.jar app.jar

# Create volume for persistent data
VOLUME /app/data

EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]