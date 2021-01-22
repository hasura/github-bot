#!/usr/bin/env bash

# Configure git email
git config --global user.email \"build@hasura.io\"

# Configure git user
git config --global user.name \"hasura-bot\"

# fetch source
git fetch git@github.com:hasura/graphql-engine-heroku.git

# Configure gcloud
gcloud auth activate-service-account --key-file=/github-bot/graphql-secrets/gcloud-graphql.json

# Configure docker
docker login -u hasurabot -p "$PASSWORD"

# get server image artifacts list
curl https://circleci.com/api/v1.1/project/github/hasura/graphql-engine/SERVER_BUILD_NUMBER/artifacts?circle-token=%(secret:circleci_token) | grep -o 'https://[^\"]*' > image_artifacts.txt

# get console artifacts list
curl https://circleci.com/api/v1.1/project/github/hasura/graphql-engine/CONSOLE_BUILD_NUMBER/artifacts?circle-token=%(secret:circleci_token) | grep -o 'https://[^\"]*' > console_artifacts.txt

# download image artifacts
<image_artifacts.txt xargs -P4 -I % wget %

version=$(cat version.txt)

# push docker image
docker push hasura/graphql-engine:$version

# copy assets

# set gcloud metadata
gsutil setmeta -h "Content-Encoding: gzip" gs://graphql-engine-cdn.hasura.io/console/assets/versioned/$version/*

# replace FROM in dockerfile
sed -i '1s/.*/FROM hasura\/graphql-engine:%(prop:version)/' Dockerfile

# Destroy app
heroku apps:destroy hge-ci-pull-$PULL_NUMBER --confirm=hge-ci-pull-$PULL_NUMBER

# Create app
heroku create hge-ci-pull-$PULL_NUMBER --stack=container

# create app addons
heroku addons:create heroku-postgresql:hobby-dev -a hge-ci-pull-$PULL_NUMBER

# git add
git add Dockerfile

# git commit
git commit -m \"update dockerfile\"

# git push to heroku
git push heroku master -f


