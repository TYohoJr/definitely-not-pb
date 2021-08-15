#!/bin/bash
set -e

cd /app/definitely-not-pb

docker-compose up -d 
kill -l
docker ps
