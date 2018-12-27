const express = require('express');
const bodyParser = require('body-parser');
const model = require('./model');
const initEmitter = require('./emitter');

const handleError = (err, req, res, debug) => {
  debug && console.log('Error:', err);
  if (err.name === 'SequelizeValidationError') {
    res.status(400).send(err.message);
  } else {
    res.status(500).send(err.message);
  }
};

const logger = debug => (req, res, next) => {
  debug && console.log('Request:', req);
  next();
};

const webhook = (config) => {
  const subApp = express();
  const emitter = initEmitter(config);
  subApp.use(bodyParser.json());

  const initPromise = model.init(config);

  initPromise.catch(() => config.debug && console.log('Error initializing the model'));

  const router = express.Router();
  router.use(bodyParser.json());
  router.use(logger(config.debug));

  router.get('/events', (req, res) => {
    res.json({
      events: config.allowedEvents,
    });
  });

  router.get('/subscriptions', async (req, res) => {
    try {
      await initPromise;
      const subscription = await model.getByDiscriminator(req.query[config.discriminatorKey]);
      res.json(subscription);
    } catch (err) {
      handleError(err, req, res, config.debug);
    }
  });

  router.get('/subscriptions/:id', async (req, res) => {
    try {
      await initPromise;
      const subscription = await model.getById(req.params.id);
      res.json(subscription);
    } catch (err) {
      handleError(err, req, res, config.debug);
    }
  });

  router.post('/subscriptions', async (req, res) => {
    try {
      await initPromise;
      const subscription = await model.create(req.body);
      res.status(201).json(subscription);
    } catch (err) {
      handleError(err, req, res, config.debug);
    }
  });

  router.delete('/subscriptions/:id', async (req, res) => {
    try {
      await initPromise;
      await model.delete(req.params.id);
      res.sendStatus(200);
    } catch (err) {
      handleError(err, req, res, config.debug);
    }
  });

  router.put('/subscriptions/:id', async (req, res) => {
    try {
      await initPromise;
      await model.update(req.params.id, req.body);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, req, res, config.debug);
    }
  });

  return { router, emitter };
};

module.exports = webhook;
