#!/usr/bin/env bash

#NAME OF THE MICROSERVICE
ARTIFACT_NAME=mycoolservice

gradle assemble
docker build -t $ARTIFACT_NAME .
docker tag $ARTIFACT_NAME:latest 553086892975.dkr.ecr.eu-west-1.amazonaws.com/$ARTIFACT_NAME:latest
docker push 553086892975.dkr.ecr.eu-west-1.amazonaws.com/$ARTIFACT_NAME:latest
./ecs-deploy.sh -c qmaticcloud-test -n ${ARTIFACT_NAME}Service -i 553086892975.dkr.ecr.eu-west-1.amazonaws.com/$ARTIFACT_NAME:latest
