#!/bin/bash

git add .
git commit -a -m "update"
git push

docker-compose --build --no-cache 
docker-compose up -d 
