'use strict';

/**
 * Module dependencies
 */
var reservationsPolicy = require('../policies/reservations.server.policy'),
  reservations = require('../controllers/reservations.server.controller');

module.exports = function(app) {
  // Reservations Routes

  app.route('/api/reservations/unregisterbydamin').all(reservationsPolicy.isAllowed)
    .post(reservations.unregisterbyadmin);
  app.route('/api/reservations/unregister').all(reservationsPolicy.isAllowed)
    .post(reservations.unregister);

  app.route('/api/reservations/confirmationmail')
    .post(reservations.confirmationMail);
  
  app.route('/api/reservations/accept').all(reservationsPolicy.isAllowed)
    .post(reservations.acceptoffer);
  app.route('/api/reservations/decline').all(reservationsPolicy.isAllowed)
    .post(reservations.declineoffer);
  app.route('/api/reservations/declineold').all(reservationsPolicy.isAllowed)
    .post(reservations.declineoldoffers);

  app.route('/api/reservations').all(reservationsPolicy.isAllowed)
    .get(reservations.list)
    .post(reservations.create);

  app.route('/api/reservations/:reservationId').all(reservationsPolicy.isAllowed)
    .get(reservations.read)
    .put(reservations.update)
    .post(reservations.update)
    .delete(reservations.delete);

  // Finish by binding the Reservation middleware
  app.param('reservationId', reservations.reservationByID);
};
