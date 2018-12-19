

# express-webhook
Express middleware which helps with bringing up express app with routes to subscribe to web-hook events.

This library does:
1. Brings up an express router for CRUD operations on webhook subscription, which is configurable and could be used with an express app.(This router uses Sequelize interfaces internally to store data. The DB that are supported by it are MySQL, SQLite,PostgresSQL, MSSQL).
2. Utility to emit webhhok events.

### Installation
`npm install express-webhook`

### Configuration:

    {
    	// List of events for which one can subscribe for (required)
    	allowedEvents: ['CREATE_CASE', 'UPDATE_CASE'],
    	// This is connectionString to connect to database.
    	connectionString: 'postgres://localhost:5432/testdb',(required)
    	// If set to true, would log
    	debug: true,
    	// Name of the field which is used to infer the owner of subscription.(Optional).
    	discriminatorKey: 'userId/'accountId'/'tenantId',
    	// Configuration used to emit events i.e to call the webhook endPoint
    	// Below mentioned values are the default values for retryConfig.(Optional)
    	retryConfig: {
	   		retries: 4,
      		factor: 2,
    		minTimeout: 1000,
    		randomize: false,
    	},
    	// Callback function which will give status of the webhook event being called.(Optional)
    	emitterCB: (eventName, payload, err) => {},
    }


### API's exposed for subscription:

 1. GET /events -> Lists all the events supported.
 2. POST /subscription -> Creates a subscription.
 3. PUT /subscription/:id -> Updates a subscription.
 4. GET /subscription/:id -> Get a subscription by id.
 5. GET /subscription?userId=123 -> Get a subscription by
    discriminatorKey mentioned above in the configuration.

#### Subscription Payload
	

    {  
	    // Name of the event that you want to subscribe for should be one of config.allowedEvents.  
	    "eventName": "EVENT_1",  
	    // The URL to be called when event is triggerd.   
	    "endPoint": "http://test.com/events", 
	    // Optional token value, which would be sent as part of webhook request header. 
	    "authorizationToken": "Bearer testToken",   
	    // Or whichever value which is configured as config.discriminatorKey.If not passed this value is set to '*', which means that subscription would recieve events that are generated for other subscriptions(if the eventName of the subscription matches). 
	    "accountId": "1234"  	
    }


### Emititng events to call the webhook:

    emitter.emit(<EVENT_NAME which is one of config.allowedEvents>, <payload>);

The event payload should have: 

 - body: The data that should be sent when webhook enpoint is called.
 - header: The header that should be sent when webhook enpoint is
   called.
 - userId/accountId/tenantId: Or whichever value is which is configured
   as discrimintorKey: Array of values to identify which discriminator
   should recieve events.

### Example:

    const express = require('express');
    const webhook = require('express-webhook');
    var app = express();
    let emitterRef;
    
    app.get('<other routes of the application>', function (req, res, next) {
      ......
    });
    
    const { router, emitter } =  webhook({
      allowedEvents: ['EVENT_1', 'EVENT_2'],
      connectionString: 'postgres://localhost:5432/testdb',
      debug: true,
      discriminatorKey: 'accountId',
      retryConfig: {},
      emitterCB: (eventName, payload, err ) => {
      	!err && console.log('Success');
      	err && console.log('Error:', err);
      },
    });
    
  	app.use('/api/v1', router);
  	app.listen(3000);
    
    
    // To emit events.
    const payload = {
    	body: JSON.stringify({ 'abc': '123' }),
      	header: { 'Content-Type': 'application/json' },
      	userId: ['123'],
    };
    emitter.emit('EVENT_1', payload);


