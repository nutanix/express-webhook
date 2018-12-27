const retry = require('async-retry');
const https = require('https');
const URL = require('url');

const defaultRetryConfig = {
  retries: 4,
  factor: 2,
  minTimeout: 1000,
  randomize: false,
};

const post = (request) => {
  const { url, body, header } = request;
  const options = URL.parse(url);
  options.method = 'POST';
  options.headers = header;
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => resolve(res.statusCode));
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
};

module.exports = {
  request: (request, config = defaultRetryConfig) => retry(async (bail) => {
    const statusCode = await post(request);
    if (statusCode >= 500) {
      return Promise.reject(new Error('Server error'));
    }
    if (statusCode >= 400) {
      return bail(new Error('Client Error'));
    }
    return statusCode;
  }, config),
};
