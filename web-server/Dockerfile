#
# Build stage
#
FROM maven:3.8.4-jdk-11 AS build
COPY src /home/web-server/src
COPY taco_lib /home/web-server/taco_lib
COPY pom.xml /home/web-server/
COPY entrypoint.sh /home/web-server/
RUN mvn -f /home/web-server/pom.xml compile package

#
# Package stage
#
FROM openjdk:11
COPY --from=build /home/web-server/entrypoint.sh /
COPY --from=build /home/web-server/target/web-server-1.0-SNAPSHOT.jar /usr/local/lib/web-server.jar 
COPY --from=build /home/web-server/taco_lib/taco.jar /usr/local/lib/taco.jar
EXPOSE 4567
ENTRYPOINT ["/entrypoint.sh"]
