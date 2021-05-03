import WebhooksApi from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

import pullRequestHandler from './pull_request';
import issueCommentHandler from './issue_comment';
import pullRequestReviewHandler from './pull_request_review';

const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'];
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

const webhooks = new WebhooksApi({
  secret: WEBHOOK_SECRET || 'mysecret'
});

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

webhooks.on('issue_comment', issueCommentHandler(octokit));
webhooks.on('pull_request', pullRequestHandler(octokit));
webhooks.on('pull_request_review', pullRequestReviewHandler(octokit));

webhooks.on('error', (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});


module.exports = (req, res) => {
  if (req.method === 'POST') {
    webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'],
      name: req.headers['x-github-event'],
      payload: req.body,
      signature: req.headers['x-hub-signature']
    }).then(() => {
      console.log('hanlded event');
      return res.status(200).send('OK');
    }, (e) => {
      console.error('ERROR: ', e);
      return res.status(500).send('ERROR');
    }).catch((e) => {
      console.error('EXCEPTION: ', e);
      return res.status(500).send('ERROR');
    });
  } else {
    return res.status(404).send('Looking for post?');
  }
};


// // uncomment and do node index.js for local development
// import EventSource from 'eventsource';
// const webhookProxyUrl = 'https://smee.io/JBPDF4Rxfx5K01x';
// const source = new EventSource(webhookProxyUrl);
// source.onmessage = (event) => {
//   const webhookEvent = JSON.parse(event.data);
//   webhooks.verifyAndReceive({
//     id: webhookEvent['x-request-id'],
//     name: webhookEvent['x-github-event'],
//     signature: webhookEvent['x-hub-signature'],
//     payload: webhookEvent.body
//   }).catch(console.error);
// };
