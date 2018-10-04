#! /bin/bash

now -e GITHUB_TOKEN=@hasura-bot-github-commenter-token -e WEBHOOK_SECRET=@hasura-bot-github-commenter-webhook-secret
now alias
now remove hasura-github-bot --safe -y
