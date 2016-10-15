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
  ArkadeventController = require(path.resolve('./modules/arkadevents/server/controllers/arkadevents.server.controller')),
  config = require(path.resolve('./config/config.js')),
  _ = require('lodash');
  
// Create smtpTransport for mailing.
var smtpTransport = nodemailer.createTransport(config.mailer.options);

function idCompare(id1,id2){
  return JSON.stringify(id1) === JSON.stringify(id2);
}
/**
 * Create a Reservation
 */
exports.create = function(req, res) {
  var reservation = new Reservation(req.body);
  reservation.user = req.user;

  var count = 0;
  Reservation.find().sort('-created').exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      console.log('Error: ' + err);
    }
    // Check if user already has booked spot
    function hasBookedSpot(r){ 
      var c = r.enrolled || r.pending || r.standby;
      return idCompare(r.user, reservation.user._id) && idCompare(r.arkadevent, reservation.arkadevent) && c;
    }
    var hasBooked = reservations.filter(hasBookedSpot);
    if(hasBooked.length > 0){
      return res.status(400).send({ message: 'User has already a spot booked for this event' });
    }
    
    // Calculate reservations that are enrolled || pending
    function isEnrolledOrPending(r){ return r.enrolled || r.pending; }
    count = reservations.filter(isEnrolledOrPending).length;
 
    // Get event
    Arkadevent.findOne({ _id: reservation.arkadevent }).exec(eventFound);
    function eventFound(err, arkadevent){
      if(err){
        console.log('Error, event not found: ' + err);
      } else {
        reservation.enrolled = arkadevent.nrofseats > count;
        reservation.standby = arkadevent.nrofseats <= count;
        doSave();
      }
    }
    // Save reservation
    function doSave(){
      reservation.save(function(err) {
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        } else {
          res.jsonp(reservation);
        }
      });
    }
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
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      count = reservations.length;
      reservations.forEach(unRoll);
    }
  }
  function unRoll(reservation){
    Reservation.findOne({ _id: reservation._id }).exec(function(err, reserv) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
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
 * Accept offer for a seat.
 */
exports.acceptoffer = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  // Get the reservation from eventid and userid
  Reservation.findOne({ user: user._id, arkadevent: arkadeventId }).exec(reservationFound);
  function reservationFound(err, reservation) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } 
    var yesterday = getYesterday();
    
    // If offer not older than 24h
    if(reservation.offer >= yesterday){
      reservation.enrolled = true;
      reservation.pending = true;
      reservation.save();
    }
  }
};

/**
 * Decline offer for a seat.
 */
exports.declineoffer = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  Reservation.findOne({ user: user._id, arkadevent: arkadeventId }).exec(reservationsFound);
  function reservationsFound(err, reservation) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } 
    var yesterday = getYesterday();
    
    // If offer not older than 24h
    if(reservation.offer >= yesterday){
      reservation.pending = false;
      reservation.save();
      
      // Offer spot to another one.
      Arkadevent.find({ _id: arkadeventId }).exec(function(err, arkadevent){
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        } else {
          ArkadeventController.offerseats({ arkadevent: arkadevent }, res);         
        }
        res.status(200).send('Decline successfull');
      });
    }
  }
};

/**
  * Get yesterday-date-object
  */
function getYesterday(){
  Date.prototype.removeDays = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
  };
  var today = Date.now();
  var yesterday = today.removeDays(1); 
  return yesterday;
}

/**
 * Decline all offers that are too old.
 */
exports.declineoldoffers = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  Reservation.find({ arkadevent: arkadeventId }).exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
 
    var yesterday = getYesterday();
    var oldRes = reservations.filter(isOld);
    function isOld(r){ return r.offer < yesterday; }

    oldRes.forEach(decline);
    function decline(r){
      r.pending = false;
      r.save();
    }
    
    // Offer spot to other standby's.
    Arkadevent.find({ _id: arkadeventId }).exec(function(err, arkadevent){
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        ArkadeventController.offerseats({ arkadevent: arkadevent }, res);         
      }
      res.status(200).send('Decline successfull');
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
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
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
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
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
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
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
    return res.status(400).send({ message: 'Reservation is invalid' });
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
