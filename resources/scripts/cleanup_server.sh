#!/bin/bash
set -e

cd /app/definitely-not-pb

IS_RUNNING=`docker-compose ps -q app`
if [[ "$IS_RUNNING" != "" ]]; then
	docker-compose down
    docker system prune -a -f
fi

# copy maintenance page out of project folder
mkdir /app/maintenance
\cp /app/definitely-not-pb/maintenance/index.html /app/maintenance/index.html
\cp /app/definitely-not-pb/maintenance/favicon.ico /app/maintenance/favicon.ico

# display maintenance page while app is down
docker run -it --rm -d -p 80:80 --name maintenance -v /app/maintenance:/usr/share/nginx/html nginx:1.19.6

cd /app

rm -rf definitely-not-pb/
