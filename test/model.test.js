const model = require('../lib/model');
const Sequelize = require('sequelize');

jest.mock('sequelize');

describe('model tests', () => {

  const config = {
    allowedEvents: ['EVENT_1', 'EVENT_2'],
    connectionString: 'postgres://localhost:5432/testdb',
    debug: false,
    discriminatorKey: 'userId',
    retryConfig: {},
    emitterCB: (eventName, payload, err ) => {},
  };

  it('on init, success', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
        }
      }
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    expect(Sequelize).toHaveBeenCalledWith(config.connectionString, { logging: false });
    expect(mockSeq.authenticate).toHaveBeenCalled();
    expect(sync).toHaveBeenCalledWith({ force: false });
  });

  it('on init, authenticate failure', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const mockSeq = {
      authenticate: jest.fn(() => Promise.reject(new Error('authenticate error'))),
      define: () => {
        return {
          sync,
        }
      }
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config).catch((err) => {
      expect(err.message).toEqual('authenticate error');
    });
  });

  it('on init, sync failure', async () => {
    const sync = jest.fn(() => Promise.reject(new Error('sync error')));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
        }
      }
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config).catch((err) => {
      expect(err.message).toEqual('sync error');
    });
  });


  it('getByDiscriminator', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const findAllResp = {};
    const findAll = jest.fn(() => Promise.resolve(findAllResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          findAll,
        }
      }
    };
    Sequelize.mockImplementation(() => mockSeq);
    await model.init(config);
    const resp = await model.getByDiscriminator('123');
    expect(findAll).toHaveBeenCalledWith({
      where: {
        discriminator: '123',
      },
    });
    expect(resp).toEqual(findAllResp);
  });

  it('getById', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const findAllResp = {};
    const findAll = jest.fn(() => Promise.resolve(findAllResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          findAll,
        }
      }
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    const resp = await model.getById('123');
    expect(findAll).toHaveBeenCalledWith({
      where: {
        id: '123',
      },
    });
    expect(resp).toEqual(findAllResp);
  });

  it('getByEventName', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const findAllResp = {};
    const findAll = jest.fn(() => Promise.resolve(findAllResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          findAll,
        }
      },
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    const resp = await model.getByEventName('EVENT_1', ['123']);
    expect(findAll).toHaveBeenCalledWith({
      where: {
        eventName: 'EVENT_1',
        discriminator: {
          [Sequelize.Op.or]: ['123', '*'],
        }
      },
    });
    expect(resp).toEqual(findAllResp);
  });

  it('create', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const createResp = {};
    const body = {};
    const create = jest.fn(() => Promise.resolve(createResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          create,
        }
      },
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    const resp = await model.create(body);
    expect(create).toHaveBeenCalledWith(body);
    expect(resp).toEqual(createResp);
  });

  it('update', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const updateResp = {};
    const body = {};
    const update = jest.fn(() => Promise.resolve(updateResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          update,
        }
      },
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    const resp = await model.update('123', body);
    expect(update).toHaveBeenCalledWith(
      body,
      { where: { id: '123', }, }
    );
    expect(resp).toEqual(updateResp);
  });

  it('delete', async () => {
    const sync = jest.fn(() => Promise.resolve());
    const deleteResp = {};
    const destroy = jest.fn(() => Promise.resolve(deleteResp));
    const mockSeq = {
      authenticate: jest.fn(() => Promise.resolve()),
      define: () => {
        return {
          sync,
          destroy,
        }
      },
    };
    Sequelize.mockImplementation(() => mockSeq);

    await model.init(config);
    const resp = await model.delete('123');
    expect(destroy).toHaveBeenCalledWith({
      where: { id: '123', },
    });
    expect(resp).toEqual(deleteResp);
  });
});
