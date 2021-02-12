export function monoRepoWorkflowDispatch(octokit, name) {
  return async (inputs) => {
    try {
      console.log(`dispatching github workflow: ${name}`);
      await octokit.actions.createWorkflowDispatch({
        owner: 'hasura',
        repo: 'graphql-engine-mono',
        workflow_id: `${name}.yml`,
        ref: 'main',
        inputs,
      });
    } catch (e) {
      console.error(`failed to dispatch github workflow: ${name}`);
      console.error(e);
    }
  };
}
