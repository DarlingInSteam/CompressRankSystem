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

# Create directory for webp binaries - will be mounted as volume
RUN mkdir -p /app/webp_binaries

# Copy the built jar file
COPY --from=build /workspace/app/build/libs/*.jar app.jar

EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]