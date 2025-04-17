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

# Build the application with explicit Java configuration
RUN ./gradlew bootJar --no-daemon --warning-mode=all -Dorg.gradle.java.home=/opt/java/openjdk

FROM eclipse-temurin:21-jre
VOLUME /tmp

# Copy the built jar file
COPY --from=build /workspace/app/build/libs/*.jar app.jar

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]