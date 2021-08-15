#!/bin/bash
set -e

cd /app/definitely-not-pb

# # if maintenance page is running then stop it
# IS_RUNNING=`docker ps -q`
# if [[ "$IS_RUNNING" != "" ]]; then
#     docker stop maintenance
# fi

docker-compose up -d 
kill -l
cd /app
# rm -rf maintenance
docker ps
