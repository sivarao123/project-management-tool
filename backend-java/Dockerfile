# Multi-stage Dockerfile for TaskFlow Java Backend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow
USER taskflow

COPY --from=build --chown=taskflow:taskflow /app/target/taskflow-backend-1.0.0.jar app.jar
RUN mkdir -p uploads

EXPOSE 5001 9092
ENV PORT=5001
ENV SOCKETIO_PORT=9092

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
