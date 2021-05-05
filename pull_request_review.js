import { handleSlashCommands } from './slash_commands';

const pullRequestReviewHandler = (octokit) => {
  return async ({ id, name, payload }) => {
    console.log(`received pull request review event: ${id}`);

    if (payload.action !== 'submitted') {
      console.log(`ignoring event as it was triggered by ${payload.action}`);
      return;
    }

    const {review: {body}, pull_request: {number: prNumber, html_url: prLink}} = payload;
    await handleSlashCommands(body, {octokit, prLink, prNumber});
  };
};

export default pullRequestReviewHandler;
