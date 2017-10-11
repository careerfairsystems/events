'use strict';

/**
 * Module dependencies
 */
var arkadeventsPolicy = require('../policies/arkadevents.server.policy'),
  arkadevents = require('../controllers/arkadevents.server.controller');

module.exports = function(app) {
  // Arkadevents Routes

  app.route('/api/arkadevents/offerseats/:arkadeventId').all(arkadeventsPolicy.isAllowed)
    .get(arkadevents.offerseats);

  app.route('/api/arkadevents').all(arkadeventsPolicy.isAllowed)
    .get(arkadevents.list)
    .post(arkadevents.create);

  app.route('/api/arkadevents/:arkadeventId').all(arkadeventsPolicy.isAllowed)
    .get(arkadevents.read)
    .put(arkadevents.update)
    .delete(arkadevents.delete);

  app.route('/api/arkadevents/reservationstate/:arkadeventId').get(arkadevents.readreservation);

  // Finish by binding the Arkadevent middleware
  app.param('arkadeventId', arkadevents.arkadeventByID);
};
