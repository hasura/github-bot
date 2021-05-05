// pull_request.js: all PR related handlers

import { prOpened, prClosed, prNovalue, prMerged } from './messages';
import { monoRepoWorkflowDispatch } from './github_action';

const pullRequestHandler = (octokit) => {
  const shadowOssPr = monoRepoWorkflowDispatch(octokit, 'migrate-hge-pr');
  const deleteReviewApp = monoRepoWorkflowDispatch(octokit, 'delete-review-app');
  const checkChangelog = monoRepoWorkflowDispatch(octokit, 'check-changelog');

  return async ({ id, name, payload }) => {

    console.log(`received pull request event: ${id}`);

    // extract relevant information
    const {action, number, repository, sender, label} = payload;
    const {pull_request: {html_url: prLink, merged, body, labels, user: {login}}} = payload;

    if (action === 'closed') {
      await deleteReviewApp({prLink});
    }

    if ((repository.name === 'graphql-engine-mono')) {
      if ((action === 'synchronize') || ((action === 'labeled') && (label.name === 'no-changelog-required'))) {
        await checkChangelog({prNumber: `${number}`});
      }
    }

    if (repository.name !== 'graphql-engine') {
      console.log(`ignoring event as it originated from ${repository.name}`);
      return;
    }

    if ((action === 'opened') || (action === 'synchronize')) {
      // There could be PRs which are shadowed from monorepo to oss repo
      // via devbot. Such PRs are identified by a `<!-- mono -->` prefix.
      // Shadowing such PRs is essential to avoid cyclic shadowing.
      if (!body.startsWith('<!-- from mono -->')) {
        await shadowOssPr({ossPrNumber: `${number}`});
      }
    }

    let isHasuraOrgMember = false;
    try {
      let result = await octokit.orgs.checkMembershipForUser({
        org: 'hasura',
        username: login
      });
      console.log('checking user membership');
      if (result.status === 204 || result.status === 302) {
        // establish user is not a hasura org member
        console.log(login, 'is a hasura org member');
        isHasuraOrgMember = true;
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
        issue_number: number,
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
      if (!merged && hasLabel(labels, 'invalid 🚫')) {
        console.log(`pr is closed with invalid label, send a bitter sorry`);
        message = prNovalue(login);
      }

      // pr is merged
      if (merged || hasLabel(labels, 'merged')) {
        console.log(`pr is merged, congratulate`);
        message = prMerged(login);
      }

      // comment with a thank you note
      const result = await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: number,
        body: message
      });
    }
  };
};

const hasLabel = (labels, target) => {
  for (let label of labels) {
    if (label.name === target) {
      return true;
    }
  }
  return false;
};

export default pullRequestHandler;
