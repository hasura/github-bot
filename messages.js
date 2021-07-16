// messages.js: messages used to comment etc.

const prOpened = (login) => {
  return `Beep boop! :robot:

Hey @${login}, thanks for your PR!

One of my human friends will review this PR and get back to you as soon as possible.

Stay awesome! :sunglasses:`;
};

const prClosed = (login) => {
  return `Beep boop! :robot:

Hey @${login}!

Sorry that your PR wasn’t merged.

Do take a look at any of the other [open issues](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) to see if you’d like to take something up! We’re around on [Discord](https://discord.gg/3FNQnWj) if you have any questions :smile:`;
};

const prNovalue = (login) => {
  return `Beep boop! :robot:

Hi @${login}, we appreciate the effort, but this pull request doesn't add any value.

Feel free to pick up an issue labelled [\`good first issue\`](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+issue%22) or [\`hacktoberfest\`](https://github.com/hasura/graphql-engine/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Ahacktoberfest) :smile:`;
};

const prMerged = (login) => {
  return `Beep boop! :robot:

![GIF](https://media1.tenor.com/images/15ae412a294bf128f6ba7e60aa0ea8e1/tenor.gif)

Awesome work @${login}!

Your changes were [merged successfully](https://github.com/hasura/graphql-engine/commits/master). All of us at Hasura :heart: what you did.

Thanks again :hugs:`;
};

const depGraphHelpMessage = `Available commands:
\`/dep-graph\`: Display this help message

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
