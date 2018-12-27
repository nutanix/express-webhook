const requestUtil = require('../lib/request');
const https = require('https');

jest.mock('https');

const retryConfig = {
  retries: 2,
  minTimeout: 0,
  factor: 0,
};

describe('requestUtil tests', () => {
  it('when response status is 200', async () => {
    const response = {
      statusCode: 200,
      data: {},
    };
    const request = {
      url: "http://test.com"
    };
    https.request = jest.fn((options, fn) => fn(response));
    const resp = await requestUtil.request(request, retryConfig);
    expect(https.request.mock.calls.length).toBe(1);
    expect(resp).toEqual(200);
  });

  it('when response status is 400, should not retry', async () => {
    const response = {
      statusCode: 400,
      data: {},
    };
    const request = {
      url: "http://test.com"
    };
    https.request = jest.fn((options, fn) => fn(response));
    return requestUtil.request(request, retryConfig).catch(() => {
      expect(https.request.mock.calls.length).toBe(1);
    });
  });

  it('when response status is 500, should retry twice', async () => {
    const response = {
      statusCode: 500,
      data: {},
    };
    const request = {
      url: "http://test.com"
    };
    https.request = jest.fn((options, fn) => fn(response));
    return requestUtil.request(request, retryConfig).catch(() => {
      expect(https.request.mock.calls.length).toBe(3);
    });
  });

  it('when request function call itself fails, should retry twice', () => {
    const response = {};
    const request = {
      url: "http://test.com",
      on: (event, cb) => {
        cb(new Error('test'));
      },
    };
    https.request = jest.fn((options, fn) => {});
    return requestUtil.request(request, retryConfig).catch(() => {
      expect(https.request.mock.calls.length).toBe(3);
    });
  });
});
