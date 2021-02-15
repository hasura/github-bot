import { monoRepoWorkflowDispatch } from './github_action';

const issueCommentHandler = (octokit) => {
  const createReviewApp = monoRepoWorkflowDispatch(octokit, 'create-review-app');
  const deleteReviewApp = monoRepoWorkflowDispatch(octokit, 'delete-review-app');

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

    const { comment: {body}, issue: {pull_request: {html_url: prLink}}} = payload;
    const commentBody = body.toUpperCase();
    const herokuSlashCommand = '/heroku '.toUpperCase();

    if (!commentBody.startsWith(herokuSlashCommand)) {
      console.log('ignoring event as it does not contain slash command');
      return;
    }

    switch(commentBody.replace(herokuSlashCommand, '').trim()) {
      case 'DEPLOY':
        console.log('triggering heroku deploy');
        await createReviewApp({prLink});
        break;
      case 'DELETE':
        console.log('triggering heroku delete');
        await deleteReviewApp({prLink});
        break;
    }
  };
};

export default issueCommentHandler;
