#
# Build stage
#
FROM maven:3.8.4-jdk-11 AS build
COPY src /home/web-server/src
COPY lib /home/web-server/lib
COPY pom.xml /home/web-server
COPY webserver.jar /usr/local/lib/web-server_new.jar
# RUN mvn -f /home/web-server/pom.xml clean package

#
# Package stage
#
FROM openjdk:11
# COPY --from=build /home/web-server/target/web-server-1.0-SNAPSHOT.jar /usr/local/lib/web-server.jar
COPY --from=build /usr/local/lib/web-server_new.jar /usr/local/lib/web-server.jar
EXPOSE 4567
ENTRYPOINT ["java","-jar","/usr/local/lib/web-server.jar"]