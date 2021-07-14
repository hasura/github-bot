import { monoRepoWorkflowDispatch } from './github_action';

export const handleSlashCommands = async (message, data) => {
  if (!message) {
    return;
  }
  message = message.toUpperCase();

  const slashCommands = [heroku, changelog];

  for (let slashCommand of slashCommands) {
    if (slashCommand.check(message)) {
      await slashCommand.handle(message, data);
      return;
    }
  }
}

const slashCommandChecker = (slashCommand) => {
  return (message) => {
    if (!message) {
      return false;
    }
    return message.toUpperCase().startsWith(slashCommand.toUpperCase());
  }
}

const subCommandMatcher = (slashCommand, subCommands) => {
  return async (message, data) => {
    message = message.toUpperCase();
    const subCommand = message.replace(slashCommand.toUpperCase(), '').trim()
    const subCommandHandler = subCommands[subCommand.toUpperCase()]

    if (!subCommandHandler) {
      console.log('no handler present for subcommand')
      return;
    }

    await subCommandHandler(data);
  }
}

const heroku = {
  slashCommand: '/heroku'
};

heroku.check = slashCommandChecker(heroku.slashCommand);
heroku.handle = subCommandMatcher(heroku.slashCommand, {
  'DEPLOY': async ({octokit, prLink}) => {
    console.log('triggering heroku deploy');
    const createReviewApp = monoRepoWorkflowDispatch(octokit, 'create-review-app');
    await createReviewApp({prLink});
  },
  'DELETE': async ({octokit, prLink}) => {
    console.log('triggering heroku delete');
    const deleteReviewApp = monoRepoWorkflowDispatch(octokit, 'delete-review-app');
    await deleteReviewApp({prLink});
  }
});

const changelog = {
  slashCommand: '/changelog',
};

changelog.check = slashCommandChecker(changelog.slashCommand);
changelog.handle = subCommandMatcher(changelog.slashCommand, {
  'OK': async ({octokit, prNumber}) => {
    console.log('triggering changelog check');
    const checkChangelog = monoRepoWorkflowDispatch(octokit, 'check-changelog');
    await checkChangelog({prNumber: `${prNumber}`});
  }
});

const depGraph = {
    slashCommand: '/dep-graph'
};

depGraph.check = slashCommandChecker(depGraph.slashCommand);
depGraph.handle = subCommandMatcher(depGraph.slashCommand, {
    'SERVER': async ({octokit, prNumber}) => {
        console.log('commenting dependency graph for server changes');
        const commentDepGraph = monoRepoWorkflowDispatch(octokit, 'comment-dependency-graph');
        await commentDepGraph({prLink});
    }
});
