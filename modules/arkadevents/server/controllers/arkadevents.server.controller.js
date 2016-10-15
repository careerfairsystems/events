'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Arkadevent = mongoose.model('Arkadevent'),
  Reservation = mongoose.model('Reservation'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  MailController = require(path.resolve('./modules/reservations/server/controllers/mail.server.controller')),
  _ = require('lodash');

/**
 * Create a Arkadevent
 */
exports.create = function(req, res) {
  var arkadevent = new Arkadevent(req.body);
  arkadevent.user = req.user;

  arkadevent.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(arkadevent);
    }
  });
};

/**
 * Show the current Arkadevent
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var arkadevent = req.arkadevent ? req.arkadevent.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  arkadevent.isCurrentUserOwner = req.user && arkadevent.user && arkadevent.user._id.toString() === req.user._id.toString();

  Reservation.find({ arkadevent: arkadevent._id, $or: [{ enrolled: true }, { pending: true }] }).count(function(err, count){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    arkadevent.seatstaken = count;
    res.jsonp(arkadevent);
  });        
};

/**
 * Offer spot for stand-by reservations that fit on the event.
 */
exports.offer = function(req, res) {
  // Convert mongoose document to JSON
  var arkadevent = req.arkadevent ? req.arkadevent.toJSON() : {};

  // Get all reservations to this event.
  Reservation.find({ arkadevent: arkadevent._id }).exec(function(err, reservations){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    // Sort reservations after created-date
    function afterCreated(r1, r2) { return r1.created > r2.created; }
    var sortRes = reservations.filter(afterCreated);

    // Get reservations that should be offered a spot.
    var nrofseats = arkadevent.nrofseats;
    var resOffer = sortRes.reduce(resToOffer);
    function resToOffer (pre, reservation){
      if(nrofseats > 0){
        return pre;
      }
      // Standby that hasnt been offered or enrolled.
      if(!reservation.enrolled && !reservation.pending && reservation.standby){
        pre.push(reservation);
      }
      nrofseats--;
      return pre;
    }

    resOffer.forEach(offerSeat);
    function offerSeat(r){
      // Update to DB
      r.pending = true; 
      r.offer = Date.now(); 
      r.save(function(err){
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } 
      });
      // Email the reservations and ask for accept/decline
      MailController.offerSpot(r, res);
    }
    resOffer.forEach(offerSeat);
    res.send(200);
  });        
};

/**
 * Update a Arkadevent
 */
exports.update = function(req, res) {
  var arkadevent = req.arkadevent;

  arkadevent = _.extend(arkadevent, req.body);

  arkadevent.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(arkadevent);
    }
  });
};

/**
 * Delete an Arkadevent
 */
exports.delete = function(req, res) {
  var arkadevent = req.arkadevent;

  arkadevent.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(arkadevent);
    }
  });
};

/**
 * List of Arkadevents
 */
exports.list = function(req, res) {
  var user = req.user;
  var userId = '';
  if(user){
    userId = user._id;
  }
  Arkadevent.find().sort('-created').populate('user', 'displayName').exec(function(err, arkadevents) {
    var incr = 0;
    function calcSpots(e){
      Reservation.find({ arkadevent: e._id, $or: [{ enrolled: true }, { pending: true }] }).exec(function(err, reservations){
        if(err){
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        function isUserSame(r) { return JSON.stringify(r.user) === JSON.stringify(userId); }
        e.data = {};
        e.seatstaken = reservations.length;
        e.data.isRegistered = reservations.filter(isUserSame).length > 0;
        incr++;
        if(incr === arkadevents.length){
          res.jsonp(arkadevents);
        }
      });        
    }
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      arkadevents.map(calcSpots);
    }
  });
};

/**
 * Arkadevent middleware
 */
exports.arkadeventByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Arkadevent is invalid'
    });
  }

  Arkadevent.findById(id).populate('user', 'displayName').exec(function (err, arkadevent) {
    if (err) {
      return next(err);
    } else if (!arkadevent) {
      return res.status(404).send({
        message: 'No Arkadevent with that identifier has been found'
      });
    }
    req.arkadevent = arkadevent;
    next();
  });
};
