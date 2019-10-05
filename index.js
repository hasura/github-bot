import WebhooksApi from '@octokit/webhooks';
import octokitLib from '@octokit/rest';
import fetch from 'node-fetch';

import pullRequestHandler from './pull_request';

const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'];
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

const webhooks = new WebhooksApi({
  secret: WEBHOOK_SECRET || 'mysecret'
});

const octokit = octokitLib();

octokit.authenticate({
  type: 'token',
  token: GITHUB_TOKEN
});

// a new pull request event
webhooks.on('pull_request', pullRequestHandler(octokit));

webhooks.on('error', (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});


require('http').createServer(webhooks.middleware).listen(3000);
// can now receive webhook events at port 3000
console.log('server listening...');
