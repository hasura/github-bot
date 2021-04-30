import { monoRepoWorkflowDispatch } from './github_action';

export const handleSlashCommands = async (message, data) => {
  message = message.toUpperCase();

  const slashCommands = [heroku, changelog];

  for (let slashCommand of slashCommands) {
    if (slashCommand.foundIn(message)) {
      await slashCommand.handle(message, data);
      return;
    }
  }
}

const slashCommandMatcher = (slashCommand) => {
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

heroku.foundIn = slashCommandMatcher(heroku.slashCommand);
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

changelog.foundIn = slashCommandMatcher(changelog.slashCommand);
changelog.handle = subCommandMatcher(changelog.slashCommand, {
  'OK': async ({octokit, prNumber}) => {
    console.log('triggering changelog check');
    const checkChangelog = monoRepoWorkflowDispatch(octokit, 'check-changelog');
    await checkChangelog({prNumber})
  }
});
