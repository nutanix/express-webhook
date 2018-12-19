const { EventEmitter } = require('events');
const model = require('./model');
const requestUtil = require('./request');

const eventHandler = async (eventName, config = {}, payload = {}) => {
  const { body, header } = payload;
  const { discriminatorKey, retryConfig, emitterCB } = config;
  try {
    const discriminator = payload[discriminatorKey];
    const subscriptions = await model.getByEventName(eventName, discriminator);
    subscriptions.forEach((item) => {
      const reformedHeader = item.authorizationToken
        ? { ...header, Authorization: item.authorizationToken } : header;
      requestUtil.request({
        url: item.endPoint,
        body,
        header: reformedHeader,
      }, retryConfig)
        .then(() => emitterCB && emitterCB(eventName, payload))
        .catch(err => emitterCB && emitterCB(eventName, payload, err));
    });
  } catch (err) {
    emitterCB && emitterCB(eventName, payload, err);
  }
};

const initEmitter = (config) => {
  const emitter = new EventEmitter();
  config.allowedEvents.forEach(event => emitter.on(
    event, payload => eventHandler(event, config, payload),
  ));
  return emitter;
};

module.exports = initEmitter;
