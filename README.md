# hasura-bot :robot:

Hasura's own GitHub bot, currently tasked with commenting on pull requests when they are opened/closed/merged.  
Deployed on [Zeit Now](https://zeit.co/now): https://hasura-github-bot.now.sh

## Local Setup

- Fork this repo and clone it on your system:
  ```bash
  git clone https://github.com/<username>/github-bot
  ```
- Navigate into the repo and install the dependencies:
  ```bash
  cd github-bot
  npm install
  ```
- Create a `.env` file and set `GITHUB_TOKEN` and `WEBHOOK_SECRET` env variables.
- Start a local server using `vercel`:
  ```bash
  npm run dev
  ```
  **Note:** By default `vercel` starts the server on port 3000. You can set a different port using the `--listen` flag.
  ```bash
  npm run dev -- --listen <port>
  ```
- Set up port forwarding with `ngrok`(install `ngrok` from [here](https://ngrok.com/download) if you don't already have it):
  ```bash
  ngrok http <port>
  ```
  In the webhook settings on Github, set the "Payload URL" to the one provided by ngrok.  
  **Note:** Also make sure that the "Content type" field in the webhook settings is set to `application/json`.

## Contribution guidelines
- Create a new branch:
  ```bash
  git checkout -b <branch-name>
  ```
- Make the required changes in the code.
- Stage and commit your changes:
  ```bash
  git add .
  git commit -m "<commit message>"
  ```
- Push the changes to your fork:
  ```bash
  git push -u origin <branch-name>
  ```
- Create a pull request to this repo.
