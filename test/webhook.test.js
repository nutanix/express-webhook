const webhook = require('../lib/webhook');
const model = require('../lib/model');
const request = require('supertest');
const express = require('express');

jest.mock('../lib/model');

function SequelizeValidationError(message) {
    this.name = "SequelizeValidationError";
    this.message = (message || "");
}
SequelizeValidationError.prototype = Error.prototype;

describe('webhook tests', () => {

  const config = {
    allowedEvents: ['CREATE_CASE', 'UPDATE_CASE'],
    connectionString: 'postgres://localhost:5432/testdb',
    debug: false,
    discriminatorKey: 'userId',
    retryConfig: {},
    emitterCB: (eventName, payload, err ) => {},
  },
  subscription = {
    endPoint: 'http://test.com/',
    eventName: 'CREATE_CASE',
    userId: 'user_1',
  };

  it('should return events', () => {
    model.init = jest.fn(() => Promise.resolve());
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .get('/events')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(resp => expect(resp.body).toEqual({ events: ['CREATE_CASE', 'UPDATE_CASE'] }))
    );
  });

  it('create a subscription', () => {
    const response = { ...subscription, id: '1234' }
    model.init = jest.fn(() => Promise.resolve());
    model.create = jest.fn(() => Promise.resolve(response));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .post('/subscriptions')
      .send(subscription)
      .expect(201)
      .expect('Content-Type', /json/)
      .then(resp => expect(resp.body).toEqual(response))
    );
  });

  it('get a subscription by id', () => {
    const response = { ...subscription, id: '1234' }
    model.init = jest.fn(() => Promise.resolve());
    model.getById = jest.fn(() => Promise.resolve(response));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .get('/subscriptions/1234')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(resp => expect(resp.body).toEqual(response))
    );
  });

  it('get a subscription by discriminatorKey', () => {
    const response = { ...subscription, id: '1234' }
    model.init = jest.fn(() => Promise.resolve());
    model.getByDiscriminator = jest.fn(() => Promise.resolve(response));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .get('/subscriptions?userId=user_1')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(resp => expect(resp.body).toEqual(response))
    );
  });

  it('update the subscription', () => {
    const updateObj = { ...subscription, endPoint: "http://test1.com" };
    const response = { ...subscription, id: '1234', endPoint: "http://test1.com" }
    model.init = jest.fn(() => Promise.resolve());
    model.update = jest.fn(() => Promise.resolve(response));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .put('/subscriptions/1234')
      .send(updateObj)
      .set('Accept', 'application/json')
      .expect(204)
    );
  });

  it('delete the subscription', () => {
    model.init = jest.fn(() => Promise.resolve());
    model.delete = jest.fn(() => Promise.resolve({}));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .delete('/subscriptions/1234')
      .expect(200)
    );
  });

  it('on validation error of create subscription', () => {
    model.init = jest.fn(() => Promise.resolve());
    model.create = jest.fn(() => Promise.reject(new SequelizeValidationError('testError')));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .post('/subscriptions')
      .send(subscription)
      .expect(400)
    );
  });

  it('on some other error happens on create subscription', () => {
    model.init = jest.fn(() => Promise.resolve());
    model.create = jest.fn(() => Promise.reject(new Error('testError')));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .post('/subscriptions')
      .send(subscription)
      .expect(500)
    );
  });

  it('when initModel fails', () => {
    model.init = jest.fn(() => Promise.reject(new Error('testError')));
    model.create = jest.fn(() => Promise.resolve({}));
    const { router } = webhook(config);
    const app = express();
    app.use('/', router);
    return (
      request(app)
      .post('/subscriptions')
      .send(subscription)
      .expect(500)
    );
  });

});
