#!/bin/bash
set -e

cd /app/definitely-not-pb

# if application is running then stop it
IS_RUNNING=`docker-compose ps -q app`
if [[ "$IS_RUNNING" != "" ]]; then
	docker-compose down
    docker system prune -a -f
fi

# if maintenance page is running then stop it
IS_RUNNING=`docker ps -q`
if [[ "$IS_RUNNING" != "" ]]; then
    docker stop maintenance
fi

# copy maintenance page out of project folder
mkdir -p /app/maintenance
\cp /app/definitely-not-pb/resources/maintenance/index.html /app/maintenance/index.html
\cp /app/definitely-not-pb/resources/maintenance/favicon.ico /app/maintenance/favicon.ico

# display maintenance page while app is down
docker run -it --rm -d -p 80:80 --name maintenance -v /app/maintenance:/usr/share/nginx/html nginx:1.19.6

cd /app

rm -rf definitely-not-pb/
