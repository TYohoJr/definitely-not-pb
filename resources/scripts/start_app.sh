#!/bin/bash
set -e

cd /app/definitely-not-pb
docker-compose build

# stop maintenace page before running app
docker stop maintenance

docker-compose up -d 
kill -l
cd /app
rm -rf maintenance
docker ps
