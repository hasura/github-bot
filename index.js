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

webhooks.on('pull_request', async ({id, name, payload}) => {
  if (name === 'pull_request') {
    const { action, number, repository, sender, pull_request: { merged, labels,
                                                                user: {login} }}
          = payload;

    let hfu = false;
    try {
      hfu = await isHacktoberfestUser(login);
    } catch (error) {
      console.error(error);
    }

    if(isHasuraOrgMember(login)) {
      return;
    }

    // pull_requst opened (not from hasura)
    if (action === 'opened') {
      const body = `Beep boop! :robot:

Hey @${login}!

Thanks for your PR! :sparkles:

I can't wait to merge it :crossed_fingers: :hammer_and_wrench:, but I don't have the permissions to do so. :x:

One of my human :woman: friends will review the changes :memo: and get back to you as soon as possible. :clock1:

Stay awesome! :sunglasses:`;
      try {
        const result = await octokit.issues.createComment({
          owner: repository.owner.login, repo: repository.name, number, body
        });
      } catch (error) {
        console.error(error);
      }
    }

    // pull_request closed
    if (action === 'closed') {
      if (sender.login === login) {
        return;
      }
      if (isInvalid(labels)) {
        return;
      }

      let body;

      if (!merged && hfu) {
        body = `Beep boop! :robot:

Hey @${login}!

Sorry that your PR wasn’t merged. :cry:

We appreciate your effort and want to reward you with some Hasura swag! :sunglasses:

Please do fill out :memo: [this form](https://goo.gl/forms/4NxUyIeTVwyWjGqE3) so we can :ship: them to you.

And do take a look at any of the other open :open_file_folder: issues to see if you’d like to take something up! We’re around on [Discord](https://discord.gg/3FNQnWj) & [Twitter](https://twitter.com/HasuraHQ) if you have any questions :smile:`;

      }

      if (merged) {
        body = `Beep boop! :robot:

Whoa! :tada: :tada: :dancer:

![GIF](https://media1.tenor.com/images/15ae412a294bf128f6ba7e60aa0ea8e1/tenor.gif)

Awesome work @${login}! :muscle: :trophy: All of us at Hasura :heart: what you did.

We would love to send you some swag! :shirt: Please allow us to do so by filling [this form](https://goo.gl/forms/4NxUyIeTVwyWjGqE3)

If you have any questions, ask us on our [Discord](https://discord.gg/3FNQnWj) & [Twitter](https://twitter.com/HasuraHQ)!

Thanks again :hugs:`;
      }

      try {
        const result = await octokit.issues.createComment({
          owner: repository.owner.login, repo: repository.name, number, body
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log(name, 'event received');
});

webhooks.on('error', (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});

const isHasuraOrgMember = (name) => {
  const HASURA_ORG_MEMBERS = ['coco98', 'rikinsk', 'ecthiender', 'rajoshighosh', 'paranoidsp', 'shahidhk', 'achocolatebear', '0x777', 'tirumaraiselvan', 'rakeshkky', 'praveenweb', 'arvi3411301', 'nizar-m', 'anandfeb25', 'dsandip', 'karthikvt26', 'surendran82', 'wawhal', 'shark-h', 'hasura-bot'];
  for (member of HASURA_ORG_MEMBERS) {
    if (name === member) {
      return true;
    }
  }
  return false;
};

const isInvalid = (labels) => {
  for (label of labels) {
    if (label === 'invalid') {
      return true;
    }
  }
  return false;
};

const isHacktoberfestUser = (user) => {
  return new Promise((resolve, reject) => {
    fetch(`https://hacktoberfest.digitalocean.com/stats/${user}`)
      .then(res => {
        if (res.status === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  });
};

require('http').createServer(webhooks.middleware).listen(3000);
// can now receive webhook events at port 3000
