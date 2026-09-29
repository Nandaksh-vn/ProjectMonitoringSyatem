FROM eclipse-temurin:21-jdk-alpine AS builder

# Install Maven (since mvnw wrapper files are not in the repository)
RUN apk add --no-cache maven

WORKDIR /app
COPY pom.xml .
# Pre-download dependencies for layer caching
RUN mvn dependency:go-offline -q

COPY src src

RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
