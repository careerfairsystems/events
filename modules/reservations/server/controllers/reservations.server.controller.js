'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Reservation = mongoose.model('Reservation'),
  Arkadevent = mongoose.model('Arkadevent'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  MailController = require(path.resolve('./modules/reservations/server/controllers/mail.server.controller')),
  config = require(path.resolve('./config/config.js')),
  _ = require('lodash');
  
// Create smtpTransport for mailing.
var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Create a Reservation
 */
exports.create = function(req, res) {
  var reservation = new Reservation(req.body);
  reservation.user = req.user;

  var count = 0;
  Reservation.find({ $or: [{ enrolled: true }, { pending: true }] }).sort('-created').exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      console.log('Error: ' + err);
    } else {
      count = reservations.length;
      Arkadevent.find({ _id: reservation.arkadevent }).exec(eventFound);
    }
  }
  function eventFound(err, arkadevent){
    if(err){
      console.log('Error, event not found: ' + err);
    } else {
      arkadevent = arkadevent[0];
      reservation.enrolled = arkadevent.nrofseats > count;
      reservation.standby = arkadevent.nrofseats <= count;
      doSave();
    }
  }
  function doSave(){
    reservation.save(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(reservation);
      }
    });
  }
};

/**
 * Show the current Reservation
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var reservation = req.reservation ? req.reservation.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  reservation.isCurrentUserOwner = req.user && reservation.user && reservation.user._id.toString() === req.user._id.toString();

  res.jsonp(reservation);
};

/**
 * Unregister a reservation to a event.
 */
exports.unregister = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  var count = 0;
  Reservation.find({ user: user._id, arkadevent: arkadeventId }).exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      count = reservations.length;
      reservations.forEach(unRoll);
    }
  }
  function unRoll(reservation){
    Reservation.findOne({ _id: reservation._id }).exec(function(err, reserv) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        reserv.enrolled = false;
        reserv.standby = false;
        reserv.pending = false;
        reserv.showedup = false;
        reserv.save();
        count--;
        if(count === 0){
          res.status(200).send('Unrollment successfull');
        }
      }
    });
  }
};

/**
 * Update a Reservation
 */
exports.update = function(req, res) {
  var reservation = req.reservation;

  reservation = _.extend(reservation, req.body);

  reservation.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reservation);
    }
  });
};

/**
 * Delete an Reservation
 */
exports.delete = function(req, res) {
  var reservation = req.reservation;

  reservation.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reservation);
    }
  });
};

/**
 * List of Reservations
 */
exports.list = function(req, res) {
  Reservation.find().sort('-created').populate('user', 'displayName').exec(function(err, reservations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(reservations);
    }
  });
};

/**
 * Reservation middleware
 */
exports.reservationByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Reservation is invalid'
    });
  }

  Reservation.findById(id).populate('user', 'displayName').exec(function (err, reservation) {
    if (err) {
      return next(err);
    } else if (!reservation) {
      return res.status(404).send({
        message: 'No Reservation with that identifier has been found'
      });
    }
    req.reservation = reservation;
    next();
  });
};



/**
  * Send confirmation mail to reservation (POST)
  */
exports.confirmationMail = function (req, res, next) {
  var id = req.body.reservationId;
  MailController.confirmationMail(id, res, next);
};
