const initEmitter = require('../lib/emitter');
const requestUtil = require('../lib/request');

const model = require('../lib/model');

jest.mock('../lib/request');
jest.mock('../lib/model');

const subscriptions = [{
  endPoint: "http://test.com",
  eventName: "EVENT_1",
  authorizationToken: "testToken"
}];

describe('Emitter test cases', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sucess scenario', async () => {
    let resolve;
    model.getByEventName = jest.fn(() => Promise.resolve(subscriptions));
    requestUtil.request = jest.fn(() => Promise.resolve({}));
    const promise = new Promise(res => resolve = res);
    const payload = {
      body: {},
      header: {},
    };
    const retryConfig = {};
    const config = {
      discriminatorKey: 'accountId',
      retryConfig,
      emitterCB: jest.fn((eventName, payload) => resolve(eventName, payload)),
      allowedEvents: ['EVENT_1']
    };
    const emitter = initEmitter(config);
    emitter.emit('EVENT_1', payload);
    await promise;

    expect(requestUtil.request.mock.calls[0][0].url).toEqual("http://test.com");
    expect(requestUtil.request.mock.calls[0][0].body).toEqual(payload.body);
    expect(requestUtil.request.mock.calls[0][1]).toEqual(retryConfig);
  });

  it('failure scenario', async () => {
    let resolve;
    model.getByEventName = jest.fn(() => Promise.reject(new Error("test error")));
    requestUtil.request = jest.fn(() => Promise.resolve({}));
    const promise = new Promise(res => resolve = res);
    const payload = { body: {}, header: {}, };
    const retryConfig = {};
    const config = {
      discriminatorKey: 'accountId',
      retryConfig,
      emitterCB: jest.fn((eventName, payload) => resolve(eventName, payload)),
      allowedEvents: ['EVENT_1']
    };
    const emitter = initEmitter(config);
    emitter.emit('EVENT_1', payload);
    await promise;

    expect(requestUtil.request).not.toHaveBeenCalled();
    expect(config.emitterCB).toHaveBeenCalled();
  });

});
