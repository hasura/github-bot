import { handleSlashCommands } from './slash_commands';

const issueCommentHandler = (octokit) => {
  return async ({ id, name, payload }) => {
    console.log(`received issue comment event: ${id}`);

    if (payload.action !== 'created') {
      console.log(`ignoring event as it was triggered by ${payload.action}`);
      return;
    }

    if (!payload.issue.pull_request) {
      console.log('ignoring event as it is not a pull request comment');
      return;
    }

    const { comment: {body}, issue: {number: prNumber, pull_request: {html_url: prLink}}} = payload;
    await handleSlashCommands(body, {octokit, prLink, prNumber});
  };
};

export default issueCommentHandler;
