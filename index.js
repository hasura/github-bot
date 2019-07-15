const WebhooksApi = require('@octokit/webhooks');
const octokit = require('@octokit/rest')();
const fetch = require('node-fetch');

const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'];
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

const webhooks = new WebhooksApi({
  secret: WEBHOOK_SECRET || 'mysecret'
});

octokit.authenticate({
  type: 'token',
  token: GITHUB_TOKEN
});

// a new pull request event
webhooks.on('pull_request', async ({id, name, payload}) => {

  // extract relevant information
  const {action, number, repository, sender} = payload;
  const {pull_request: {merged, labels, user: {login}}} = payload;

  // check if user is registered for Hacktoberfest
  // disabled until next hacktoberfest
  // let hfu = await isHacktoberfestUser(login);
  let hfu = false;

  // check if the user is a Hasura org member
  let isHasuraOrgMember = false;
  try {
    let result = await octokit.orgs.checkMembership({
      org: 'hasura',
      username: login
    });
    if (result.status === 204 || result.status === 302) {
      isHasuraOrgMember = true;
    }
  } catch (e) {
    isHasuraOrgMember = false;
  }

  // do nothing if the user is a Hasura org member
  if(isHasuraOrgMember) {
    return;
  }

  // pull_requst opened event (not from hasura)
  if (action === 'opened') {
    const body = `Beep boop! :robot:

Hey @${login}, thanks for your PR!

One of my human friends will review this PR and get back to you as soon as possible. :clock1:

Stay awesome! :sunglasses:`;

    // comment on the PR
    const result = await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      number,
      body
    });

  }

  // pull_request closed
  if (action === 'closed') {

    // closed by author themself, do nothing
    if (sender.login === login) {
      return;
    }

    // pr has an invalid label, do nothing
    if (isInvalid(labels)) {
      return;
    }

    let body;

    // pr is not merged and user is registered for hacktoberfest
    if (!merged && hfu) {
      body = `Beep boop! :robot:

Hey @${login}!

Sorry that your PR wasn’t merged. :cry:

Do take a look at any of the other open issues to see if you’d like to take something up! We’re around on [Discord](https://discord.gg/3FNQnWj) & [Twitter](https://twitter.com/HasuraHQ) if you have any questions :smile:`;

    }

    // pr is merged
    if (merged) {
      body = `Beep boop! :robot:

![GIF](https://media1.tenor.com/images/15ae412a294bf128f6ba7e60aa0ea8e1/tenor.gif)

Awesome work @${login}! All of us at Hasura :heart: what you did.

Thanks again :hugs:`;
    }

    // comment with a thank you note
    const result = await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      number,
      body
    });
  }

  console.log('event received');
});

webhooks.on('error', (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});

const isInvalid = (labels) => {
  for (label of labels) {
    if (label.name === 'invalid') {
      return true;
    }
  }
  return false;
};

const isHacktoberfestUser = (user) => {
  return new Promise((resolve, reject) => {
    fetch(`https://hacktoberfest.digitalocean.com/stats/${user}`)
      .then(res => {
        resolve(res.status === 200);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  });
};

require('http').createServer(webhooks.middleware).listen(3000);
// can now receive webhook events at port 3000
