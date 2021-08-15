#!/bin/bash
set -e

cd /app/definitely-not-pb

echo Preparing server...

touch .env

AWS_ACCESS_KEY_ID=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/AWS_ACCESS_KEY_ID --with-decryption --query Parameter.Value`
AWS_ACCESS_KEY_ID=`echo $AWS_ACCESS_KEY_ID | sed -e 's/^"//' -e 's/"$//'`
AWS_ACCESS_KEY_ID="AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}"
echo $AWS_ACCESS_KEY_ID >> .env

AWS_SECRET_ACCESS_KEY=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/AWS_SECRET_ACCESS_KEY --with-decryption --query Parameter.Value`
AWS_SECRET_ACCESS_KEY=`echo $AWS_SECRET_ACCESS_KEY | sed -e 's/^"//' -e 's/"$//'`
AWS_SECRET_ACCESS_KEY="AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}"
echo $AWS_SECRET_ACCESS_KEY >> .env

AWS_DEFAULT_REGION=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/AWS_DEFAULT_REGION --query Parameter.Value`
AWS_DEFAULT_REGION=`echo $AWS_DEFAULT_REGION | sed -e 's/^"//' -e 's/"$//'`
AWS_DEFAULT_REGION="AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}"
echo $AWS_DEFAULT_REGION >> .env

DB_PORT=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_PORT --query Parameter.Value`
DB_PORT=`echo $DB_PORT | sed -e 's/^"//' -e 's/"$//'`
DB_PORT="DB_PORT=${DB_PORT}"
echo $DB_PORT >> .env

DB_HOST=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_HOST --query Parameter.Value`
DB_HOST=`echo $DB_HOST | sed -e 's/^"//' -e 's/"$//'`
DB_HOST="DB_HOST=${DB_HOST}"
echo $DB_HOST >> .env

DB_USER=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_USER --query Parameter.Value`
DB_USER=`echo $DB_USER | sed -e 's/^"//' -e 's/"$//'`
DB_USER="DB_USER=${DB_USER}"
echo $DB_USER >> .env

DB_PASSWORD=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_PASSWORD --with-decryption --query Parameter.Value`
DB_PASSWORD=`echo $DB_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
DB_PASSWORD="DB_PASSWORD=${DB_PASSWORD}"
echo $DB_PASSWORD >> .env

DB_NAME=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_NAME --query Parameter.Value`
DB_NAME=`echo $DB_NAME | sed -e 's/^"//' -e 's/"$//'`
DB_NAME="DB_NAME=${DB_NAME}"
echo $DB_NAME >> .env

DB_SSL_MODE=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/DB_SSL_MODE --query Parameter.Value`
DB_SSL_MODE=`echo $DB_SSL_MODE | sed -e 's/^"//' -e 's/"$//'`
DB_SSL_MODE="DB_SSL_MODE=${DB_SSL_MODE}"
echo $DB_SSL_MODE >> .env

EMAIL_NAME=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/EMAIL_NAME --query Parameter.Value`
EMAIL_NAME=`echo $EMAIL_NAME | sed -e 's/^"//' -e 's/"$//'`
EMAIL_NAME="EMAIL_NAME=${EMAIL_NAME}"
echo $EMAIL_NAME >> .env

EMAIL_PASSWORD=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/EMAIL_PASSWORD --with-decryption --query Parameter.Value`
EMAIL_PASSWORD=`echo $EMAIL_PASSWORD | sed -e 's/^"//' -e 's/"$//'`
EMAIL_PASSWORD="EMAIL_PASSWORD=${EMAIL_PASSWORD}"
echo $EMAIL_PASSWORD >> .env

ENVIRONMENT=`aws ssm get-parameter --region us-east-2 --name /def-not-pb/ENVIRONMENT --query Parameter.Value`
ENVIRONMENT=`echo $ENVIRONMENT | sed -e 's/^"//' -e 's/"$//'`
ENVIRONMENT="DB_SSL_MODE=${ENVIRONMENT}"
echo $ENVIRONMENT >> .env

echo Server prepared
