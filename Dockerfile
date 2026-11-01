# ---- Build du backend Spring Boot ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Les dépendances d'abord : ce calque reste en cache tant que pom.xml ne change pas.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- Image d'exécution ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S tangzer && adduser -S tangzer -G tangzer \
    && mkdir -p /app/data && chown tangzer:tangzer /app/data

COPY --from=build /build/target/*.jar app.jar

USER tangzer
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
