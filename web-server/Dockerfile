#
# Build stage
#
FROM maven:3.8.4-jdk-11 AS build
COPY src /home/web-server/src
COPY pom.xml /home/web-server
RUN mvn -f /home/web-server/pom.xml clean package

#
# Package stage
#
FROM openjdk:11
COPY --from=build /home/web-server/target/web-server-1.0-SNAPSHOT.jar /usr/local/lib/web-server.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/usr/local/lib/web-server.jar"]