export const checkCircleCiContext = (context) => {
  let pattern = /ci\/circleci:\s(.*)/;
  let str = context.match(pattern);
  if (!str) {
    return
  }
  return str[1]
};

export const getBuildNumber = (url) => {
  let pattern = /https?:\/\/.+?\/.+?\/.+?\/.+?\/(\d+)/;
  let str = url.match(pattern);
  if (!str) {
    return
  }
  return str[1]
};

export const getPullRequest = (branch) => {
  let pattern = /https?:\/\/.+?\/.+?\/.+?\/.+?\/(\d+)/;
  let str = branch.match(pattern);
  if (!str) {
    return
  }
  return str[1]
};

export const getCombinedStatus = (res) => {
  let obj = {};
  res.forEach((elem) => {
    let status_name = checkCircleCiContext(elem['context']);
    if (status_name === ""){
      return
    }
    let build_number = getBuildNumber(elem['target_url']);
    if (build_number === "") {
      return
    }
    if (elem['state'] !== "success") {
      return
    }
    if (!elem.hasOwnProperty('status_name')) {
      obj[status_name] = {
        'build_number': build_number
      }
    }
  });
  return obj
};

export const makeGcloudCpCommand = (data) => {

};