FROM frolvlad/alpine-oraclejdk8:slim
VOLUME /tmp
ADD build/libs/mycoolservice.jar app.jar
RUN sh -c 'touch /app.jar'
ENV JAVA_OPTS="-Dspring.profiles.active=ecstest"
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /app.jar" ]
EXPOSE 9003
