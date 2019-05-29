const Sequelize = require('sequelize');

const { Op } = Sequelize;

module.exports = {
  getSchema(config) {
    return {
      eventName: {
        type: Sequelize.STRING,
        validate: {
          isIn: {
            args: config.allowedEvents,
            msg: `eventName must be one of ${config.allowedEvents}`,
          },
        },
      },
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      endPoint: {
        type: Sequelize.STRING,
        validate: {
          isUrl: true,
        },
      },
      authorizationToken: {
        type: Sequelize.STRING,
      },
      [config.discriminatorKey]: {
        type: Sequelize.STRING,
        field: 'discriminator',
        defaultValue: '*',
      },
    };
  },

  async init(config) {
    this.config = config;
    const db = await this.connect(config.connectionString);
    await this.syncDb(config, db);
  },

  async connect(connectionString) {
    const { debug } = this.config;
    const db = new Sequelize(connectionString, { logging: debug ? console.log : debug });
    await db.authenticate();
    debug && console.log('connect is successfull');
    return db;
  },

  async syncDb(config, db) {
    this.subscription = db.define('Subscription', this.getSchema(config));
    await this.subscription.sync({ force: false });
    config.debug && console.log('sync is successfull');
  },

  async getByDiscriminator(discriminator) {
    const { debug } = this.config;
    const subscriptions = await this.subscription.findAll({
      where: {
        discriminator,
      },
    });
    debug && console.log(`get for discriminator ${discriminator}: `, subscriptions);
    return subscriptions;
  },

  async getById(id) {
    const { debug } = this.config;
    const subscriptions = await this.subscription.findAll({
      where: {
        id,
      },
    });
    debug && console.log(`get for id ${id}: `, subscriptions);
    return subscriptions;
  },

  async getByEventName(eventName, discriminator) {
    const { debug } = this.config;
    const subscriptions = await this.subscription.findAll({
      where: {
        eventName,
        discriminator: {
          [Op.or]: discriminator.concat('*'),
        },
      },
    });
    debug && console.log(`getByEventName for eventName ${eventName} and discriminator ${discriminator}: `, subscriptions);
    return subscriptions;
  },

  async create(body) {
    const { debug } = this.config;
    const subscription = this.subscription.create(body);
    debug && console.log(`create subscription for body ${body}: `, subscription);
    return subscription;
  },

  async update(id, body) {
    const { debug } = this.config;
    const subscription = this.subscription.update(body, { where: { id } });
    debug && console.log(`update result for ${id} and body ${body}: `, subscription);
    return subscription;
  },

  async delete(id) {
    const { debug } = this.config;
    const subscription = this.subscription.destroy({ where: { id } });
    debug && console.log(`delete subscription for id ${id}: `, subscription);
    return subscription;
  },
};
