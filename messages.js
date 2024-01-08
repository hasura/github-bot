// messages.js: messages used to comment etc.

const prOpened = (login) => {
  return `:robot:

Thanks for your PR @${login}!

A member of our team will review it and provide feedback shortly. We appreciate your patience and enthusiasm in improving Hasura.

Best regards!`;
};

const prClosed = (login) => {
  return `:robot:

Hi, @${login} —

We regret to inform you that your PR has not been merged. However, your efforts are greatly appreciated, and we encourage you to stay involved.

Please consider contributing to other [open issues](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) that might align with your expertise. Our community is active on [Discord](https://discord.gg/3FNQnWj), and we're here to support you with any questions you might have.

Thank you for your understanding and continued support.`
};

const prNovalue = (login) => {
  return `:robot:

  Thank you for your submission. We value your contribution, although after careful review, we've determined that this PR doesn't align with our current project needs.

  This does not reflect the quality of your work, and we encourage you to explore other [open issues](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+issue%22) labeled as [\`good first issue\`](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+issue%22) or [\`hacktoberfest\`](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Ahacktoberfest). We're here to assist on [Discord](https://discord.gg/3FNQnWj) if you have any questions.
  
  Keep up the great work, and we look forward to your future contributions!`;
};

const prMerged = (login) => {
  return `:robot:

![GIF](https://media1.tenor.com/images/15ae412a294bf128f6ba7e60aa0ea8e1/tenor.gif)

Awesome work, @${login}!

Your changes were [merged successfully](https://github.com/hasura/graphql-engine/commits/master). All of us at Hasura :heart: what you did.

Thanks again :rocket:`;
};

const depGraphHelpMessage = `Available commands:

\`/dep-graph help\`: Display this help message

\`/dep-graph server\`: Comment dependency graph for changes in server codebase

\`/dep-graph pro-server\`: Comment dependency graph for changes in pro server codebase

\`/dep-graph all\`: Comment dependency graph for changes in all supported codebases
`;

export {
  prOpened,
  prClosed,
  prNovalue,
  prMerged,
  depGraphHelpMessage,
};
