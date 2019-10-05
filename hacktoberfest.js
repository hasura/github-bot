// hacktoberfest.js: all hacktoberfest related handlers

import fetch from 'node-fetch';

const isHacktoberfestUser = (user) => {
  return new Promise((resolve, reject) => {
    fetch(`https://hacktoberfest.digitalocean.com/stats/${user}`)
      .then(res => {
        resolve(res.status === 200);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  });
};

export default {
  isHacktoberfestUser,
};
