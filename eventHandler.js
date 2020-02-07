import {checkCircleCiContext, getPullRequest, getCombinedStatus} from './util'

require('dotenv').config();
const fetch = require("node-fetch");
const Octokit = require("@octokit/rest");
const client = new Octokit();
const {CircleCI} = require("circleci-api");

const CIRCLECI_TOKEN = process.env.CIRCLE_CI_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

client.authenticate({
  type: 'token',
  token: GITHUB_TOKEN
});

const eventHandler = (payload) => {
  const event = payload['x-github-event'];
  switch(event) {
    case 'pull_request':
      handlePullRequest(payload);
        break;
    case 'issue_comment':
      handleIssueComment(payload);
      break;
    case 'status':
      handleStatus(payload);
      break;
  }
};

const handlePullRequest = async (payload) => {
  const repo = payload['body']['repository']['name'];
  const number = payload['body']['number'];
  const action = payload['body']['action'];

  if (action !== 'closed') {
    console.log(`Not a create action`)
    //  TODO: return a response object
    return
  }
  const data = await deleteHerokuApp(number);
  data.then(() => {
    postComment(repo, number, `Review App https://hge-ci-pull-${number}.herokuapp.com is deleted`)
  })
};

const handleIssueComment = async (payload) => {
  const repo = payload['body']['repository']['name'];
  const number = payload['body']['comment']['id'];
  const issue_number = payload['body']['issue']['number'];
  const action = payload['body']['action'];
  const user = payload['body']['comment']['user']['login'];


  if (!(action === 'created' || action !== 'deleted')) {
    console.log(`Github comment ${number}, Ignoring: ${action} event`)
    //  TODO: return a response object
    return
  }

  if (!checkPullRequest(payload)) {
    console.log(`Github comment ${number}, Ignoring: Not a Pull Request`)
    // TODO: return a response object
  }

  const comment = payload['body']['comment']['body'].trim().split(" ");
  if (comment.length > 2) {
    console.log('invalid command');
    return
  }

  if (comment[0] !== '/heroku') {
    console.log('invalid command');
    return
  }

  if (! (comment[1] === 'deploy' || comment[1] === 'delete') ) {
    console.log(`Not a valid comment ${comment}`);
    postComment(repo, issue_number, `@${user} not a valid heroku command (deploy, delete)`);
    //  TODO: return a response object
    return
  }

  try {
    const orgs = await getOrgs(user);
    if (! (Object.entries(orgs).length === 0 || orgs['data']['organization']['login'] === 'hasura') ) {
      postComment(repo, issue_number, `@${user} you don't have enough permissions to execute this command`)
      //  TODO: return a response object
    }
  } catch (e) {
    if (e.code === 404) {
      console.log(`Error occurred: `, e)
    }
  }

  if (comment[1] === 'deploy') {
    const commits = await getCommits(repo, issue_number);
    if (Object.entries(commits).length === 0) {
      console.log(`there are no commits in the pull request ${issue_number}`);
      postComment(repo, issue_number, `@${user} there are no commits in the PR`);
      //  TODO: return a response object
      return
    }
    const commit = commits['data'][0]['sha'];
    const status = await getStatus(repo, commit);
    const statuses = getCombinedStatus(status.data.statuses.reverse());
    if (Object.entries(statuses).length === 0) {
      console.log(`Invalid statuses ${statuses}`);
      //  TODO: return a response object
      return
    }
//  Get workflow name using check_build_worthiness job
    const build_number = statuses['check_build_worthiness']['build_number'];
//  Get the current build info to find the workflow name.
    const current_build_info = await getBuildInfo(user, repo, build_number);
    console.log(current_build_info);
    if (!current_build_info) {
      console.log('Cannot fetch build info')
      //  TODO: return a response object
    }
    let server_status_name = '';
    let console_status_name = '';
    const workflowName = current_build_info['workflows']['workflow_name'];
    if (workflowName === 'build_and_test') {
      server_status_name = 'build_server';
      console_status_name = 'test_and_build_console'
    } else if (workflowName === 'workflow_v20190516') {
      server_status_name = 'build_server';
      console_status_name = 'build_console'
    } else if (workflowName === 'workflow_v20200120') {
      server_status_name = 'build_image';
      console_status_name = 'build_console'
    } else {
      //  TODO: return a response object
    }

    if (!statuses.hasOwnProperty(server_status_name) && !statuses.hasOwnProperty(console_status_name)) {
      console.log('console and server checks missing');
      postComment(repo, issue_number, `@${user} status checks not passed for commit https://github.com/${repo}/pull/${issue_number}/commits/${commit}`)
      //  TODO: return a response object
    }

    const consoleBranch_json = await getBuildInfo(user, repo, statuses[console_status_name]['build_number']);
    const consoleBranch = getPullRequest(consoleBranch_json['branch']);
    if (consoleBranch === "") {
      postComment(repo, issue_number, `@${user} not able to deploy heroku app`)
      //  TODO: return a response object
    }

    const serverBranch_json = await getBuildInfo(user, repo, statuses[server_status_name]['build_number']);
    const serverBranch = getPullRequest(serverBranch_json['branch']);
    if (serverBranch === "" || serverBranch !== consoleBranch) {
      postComment(repo, issue_number, `@${user} not able to deploy heroku app`)
      //  TODO: return a response object
    }

//  Get artifacts list
    statuses[console_status_name]['artifacts'] = getArtifacts(user, repo, statuses[console_status_name]['build_number']);
    statuses[server_status_name]['artifacts'] = getArtifacts(user, repo, statuses[server_status_name]['build_number']);
    console.log('App deployed with zero errors')
  } else if (comment[1] === 'delete') {
    await deleteHerokuApp(issue_number);
    postComment(repo, issue_number, `Review App https://hge-ci-pull-${issue_number}.herokuapp.com is deleted`)
  }
};

const checkPullRequest = (payload) => {
  return payload['body']['issue'].hasOwnProperty('pull_request');
};

const postComment = (repo, number, body) => {
  client.issues.createComment({
    owner: 'hasura',
    repo: repo,
    number: number,
    body: body
  }).then((res) => {
    if (res.status !== 201) {
      console.log(`Failed to update comment for ${repo}, message: ${res['message']}`);
      return false
    }
    return true
  }).catch((err) => {
    console.log("error occurred: " + err)
  })
};

const getOrgs = async (user) => {
  return await client.orgs.getMembership({
    org: 'hasura',
    username: user
  });
};

const getCommits = async (repo, pull_number) => {
  return await client.pullRequests.listCommits({
    owner: 'hasura',
    repo,
    number: pull_number
  })
};

const getStatus = async (repo, sha) => {
  return await client.repos.getCombinedStatusForRef({
    owner: 'hasura',
    repo: repo,
    ref: sha
  })
};

const handleStatus = (payload) => {
  const repo = payload['body']['repository']['name'];
  const sha = payload['body']['sha'];
  let status;
  let status_name;
  let state;
  status = client.repos.getCombinedStatusForRef({
    owner: 'hasura',
    repo: repo,
    ref: sha
  });
  status.then((res) => {
    res.data.statuses.forEach((elem) => {
      status_name = checkCircleCiContext(elem['context']);
      state = elem['state'];
      if (status_name === 'build_server' && state === 'success') {
        //  TODO: deploy review app
        console.log('herokuapp deployed')
      }
    })
  })
};

const getBuildInfo = async (login, repo, build_number) => {
  const api = new CircleCI({
    token: CIRCLECI_TOKEN,
    vcs: {
      owner: 'hasura',
      repo: repo
    }
  });
  return await api.build(build_number)
};

const getArtifacts = async (login, repo, build_number) => {
  const api = new CircleCI({
    token: CIRCLECI_TOKEN,
    vcs: {
      owner: 'hasura',
      repo: repo
    }
  });

  return await api.artifacts(build_number)
};

const deleteHerokuApp = async (pullNumber) => {
  const url =`https://api.heroku.com/review-apps/${pullNumber}`;
  return await fetch(url, {
    method: 'DELETE'
  })
};

export default eventHandler;