// pull_request.js: all PR related handlers

import { prOpened, prClosed, prNovalue, prMerged } from './messages';

const pullRequestHandler = (octokit) => {
  return async ({ id, name, payload }) => {

    console.log(`received pull request event: ${id}`);

    // extract relevant information
    const {action, number, repository, sender} = payload;
    const {pull_request: {merged, labels, user: {login}}} = payload;

    let isHasuraOrgMember = true;
    try {
      let result = await octokit.orgs.checkMembership({
        org: 'hasura',
        username: login
      });
      console.log('checking user membership');
      if (result.status === 204 || result.status === 302) {
        // establish user is not a hasura org member
        console.log(login, 'is a hasura org member');
        isHasuraOrgMember = false;
      }
    } catch (e) {
      if (e.code === 404) {
        console.log(login, 'is not a hasura org member');
      } else {
        console.error('error while checking for hasura org membership: ', e.toString());
        // cannot reliably do anything, so do nothing
        return;
      }
    }

    // do nothing if the user is a Hasura org member
    if(isHasuraOrgMember) {
      console.log(`${login} is hasura org member, do nothing`);
      return;
    }

    // pull_requst opened event (not from hasura)
    if (action === 'opened') {
      console.log(`${login} opened a pull request, make a welcome comment`);

      // comment on the PR
      const result = await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        number,
        body: prOpened(login)
      });
    }

    // pull_request closed
    if (action === 'closed') {

      // closed by author themselves, do nothing
      if (sender.login === login) {
        console.log(`author closed the pull request, do nothing`);
        return;
      }

      let message;

      // pr is closed without invalid label
      if (!merged) {
        console.log(`pr closed, send a sorry`);
        message = prClosed(login);
      }

      // pr has an invalid label and closed, reply with novalue comment
      if (!merged && isInvalid(labels)) {
        console.log(`pr is closed with invalid label, send a bitter sorry`);
        message = prNovalue(login);
      }

      // pr is merged
      if (merged) {
        console.log(`pr is merged, congratulate`);
        message = prMerged(login);
      }

      // comment with a thank you note
      const result = await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        number,
        body: message
      });
    }
  };
};

const isInvalid = (labels) => {
  for (let label of labels) {
    if (label.name === 'invalid') {
      return true;
    }
  }
  return false;
};


export default pullRequestHandler;
