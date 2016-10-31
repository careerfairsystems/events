'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Reservation = mongoose.model('Reservation'),
  Arkadevent = mongoose.model('Arkadevent'),
  User = mongoose.model('User'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  MailController = require(path.resolve('./modules/mailtemplates/server/controllers/mail.server.controller')),
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
  Reservation.find({ arkadevent: new ObjectId(reservation.arkadevent) }).sort('-created').exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      console.log('Error: ' + err);
    }
    // Check if user already has booked spot
    function hasBookedSpot(r){ 
      var c = r.enrolled || r.standby;
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
  reservation.isCurrentUserOwner = req.user && reservation.user && idCompare(reservation.user, req.user._id);

  res.jsonp(reservation);
};

/**
 * Unregister a reservation to a event.
 */
exports.unregister = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  doUnregisterReservation(user, arkadeventId, res, req);
};

/**
 * Unregister a reservation to a event.
 */
exports.unregisterbyadmin = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var userId = req.body.userId;

  User.findOne({ _id: new ObjectId(userId) }, function(err, user){
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    doUnregisterReservation(user, arkadeventId, res, req);
  });
};

function doUnregisterReservation(user, arkadeventId, res, req){
  var count = 0;
  Reservation.find({ user: user._id, arkadevent: new ObjectId(arkadeventId) }).exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    count = reservations.length;

    Arkadevent.findOne({ _id: new ObjectId(arkadeventId) }, function(err, arkadevent){
      reservations.forEach(unRoll);
      function unRoll(reservation){
        Reservation.update({ _id: new Object(reservation._id) }, { $set: { enrolled: false, standby: false, pending: false } }).exec(function(err, affected, reserv) {
          if (err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          }
          count--;
          if(count <= 0){
            // Offer seat to other reservations
            var hasResponded = false;
            sendEmailWithTemplate(reservation._id, req, res, 'unregisteredmail', specifikContent, callback);
          }
          function specifikContent (reservation){
            return '';
          }
          function callback(success){
            ArkadeventController.offerSeatsOnEvent(arkadevent, function(success){
              if(!hasResponded){
                if(success){
                  res.status(200).send({ message: 'Succesfully sent email' }); 
                } else {
                  res.status(400).send({ message: 'Failed to sent email' }); 
                }
                hasResponded = true;
              }
            }, res, req);
          }
        });
      }
    });
  }
}


/**
 * Offer seat to student.
 */
exports.offerseat = function(req, res) {
  var reservationId = req.body.reservationId;
  var today = new Date();

  // Get the reservation from eventid and userid
  Reservation.update({ _id: new ObjectId(reservationId) }, { $set: { pending: true, offer: today } }, reservationFound);
  function reservationFound(err, affected) {
    if (err) {
      return res.status(400).send({ message: 'Couldnt find reservation' });
    } 
    // Send email to reservation of being unregistered
    sendEmailWithTemplate(reservationId, req, res, 'seatofferedmail');
    function specifikContent(reservation){
      console.log('Host: ' + config.host);
      console.log('Res_id: ' + reservation._id);
      var str = '\n\n';
      str += 'Link to verify that you are still interested in attending the event:\n';
      str += config.host + '/reservations/offer/' + reservation._id;
      str += '\n';
      return str;
    }
  }
};

/**
 * Accept offer for a seat.
 */
exports.acceptoffer = function(req, res) {
  var reservationId = req.body.reservationId;
  var userId = req.body.userId;
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;
  
  // Get the reservation from eventid and userid
  if(!reservationId){
    if(userId && arkadeventId){
      Reservation.findOne({ user: new ObjectId(userId), arkadevent: new ObjectId(arkadeventId) }, reservationFound);
    } else {
      res.status(400).send({ message: 'Bad request data. Userid and arkadeventid not given' });
    }
  } else {
    Reservation.findOne({ user: new ObjectId(user._id), _id: new ObjectId(reservationId) }, reservationFound);
  }
  
  function reservationFound(err, reservation) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } 
    var yesterday = getYesterday();
    var isCurrentUserOwner = req.user && reservation.user && idCompare(reservation.user, req.user._id);

    // If offer not older than 24h
    if((reservation.offer && reservation.offer.getTime() > yesterday.getTime()) && isCurrentUserOwner){
      Reservation.update({ _id: new ObjectId(reservation._id) }, { pending: false, enrolled: true, offer: null }, function(err, affected, resp){
        if(err){
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }
        return res.status(200).send({ message: 'Success' });
      });
    } else {
      return res.status(400).send({ message: 'The offer period has expired' });
    }
  }
};

/**
 * Decline offer for a seat.
 */
exports.declineoffer = function(req, res) {
  var reservationId = req.body.reservationId;
  var userId = req.body.userId;
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;
  
  // Get the reservation from eventid and userid
  if(!reservationId){
    if(userId && arkadeventId){
      Reservation.findOne({ user: new ObjectId(userId), arkadevent: new ObjectId(arkadeventId) }, reservationFound);
    } else {
      res.status(400).send({ message: 'Bad request data. Userid and arkadeventid not given' });
    }
  } else {
    Reservation.findOne({ user: new ObjectId(user._id), _id: new ObjectId(reservationId) }, reservationFound);
  }
  function reservationFound(err, reservation) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } 
    var yesterday = getYesterday();
    reservation.offer = new Date(reservation.offer);
    var isCurrentUserOwner = user && reservation.user && idCompare(reservation.user, user._id);

    // If offer not older than 24h
    if(reservation.offer && (reservation.offer.getTime() > yesterday.getTime()) && isCurrentUserOwner){
      Reservation.update({ _id: new ObjectId(reservation._id) }, { standby: false, enrolled: false, pending: false, offer: null }, function(err, affected, resp){
        if(err){
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }

        console.log('Decline successfull');
        // Offer spot to another one.
        Arkadevent.findOne({ _id: reservation.arkadevent }).exec(function(err, arkadevent){
          if (err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          } else {
            var hasResponded = false;
            console.log('Offer other students a seat');
            ArkadeventController.offerSeatsOnEvent(arkadevent, function(success){
              if(!hasResponded){
                console.log('Success:' + JSON.stringify(success));
                if(success){
                  res.status(200).send({ message: 'Succesfully sent email' });
                } else {
                  res.status(400).send({ message: 'Failed to sent email' });
                }
                hasResponded = true;
              }
            }, res, req);
          }
        });
      });
    } else {
      return res.status(400).send({ message: 'The offer period has expired' });
    }
  }
};

/**
  * Get yesterday-date-object
  */
function getYesterday(){
  var today = new Date();
  today.setDate(today.getDate() - 1);
  return today;
}

/**
 * Decline all offers that are too old.
 */
exports.declineoldoffers = function(req, res) {
  var arkadeventId = req.body.arkadeventId;
  var user = req.user;

  Reservation.find({ arkadevent: new ObjectId(arkadeventId) }).exec(reservationsFound);
  function reservationsFound(err, reservations) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
 
    var yesterday = getYesterday();
    var oldRes = reservations.filter(isOld);
    function isOld(r){ return r.offer.getTime() < yesterday.getTime(); }

    var count = oldRes.length;
    oldRes.forEach(decline);
    function decline(r){
      Reservation.update({ _id: new ObjectId(r._id) }, { $set: { pending: false } }, function(err,affected){
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }
        oldRes--;
        // When all async updates are done.
        if(oldRes <= 0){

          // Offer spot to other standby's.
          Arkadevent.find({ _id: new ObjectId(arkadeventId) }).exec(function(err, arkadevent){
            if (err) {
              return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
            } else {
              var hasResponded = false;
              ArkadeventController.offerSeatsOnEvent(arkadevent, function(success){
                if(!hasResponded){
                  if(success){
                    res.status(200).send({ message: 'Succesfully sent email' }); 
                  } else {
                    res.status(400).send({ message: 'Failed to sent email' }); 
                  }
                  hasResponded = true;
                }
              }, res, req);
            }
          });
        }
      });
    }
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
exports.seatofferedmail = function (req, res, next) {
  var id = req.body.reservationId;
  sendEmailWithTemplate(req.body.reservationId, req, res, 'seatofferedmail');
};


/**
  * Send confirmation mail to reservation (POST)
  */
exports.unregisteredmail = function (req, res, next) {
  var id = req.body.reservationId;
  sendEmailWithTemplate(req.body.reservationId, req, res, 'unregisteredmail');
};

/**
  * Send confirmation mail to reservation (POST)
  */
function reservmail(req, res, next) {
  sendEmailWithTemplate(req.body.reservationId, req, res, 'reservmail');
}

/**
  * Send confirmation mail to reservation (POST)
  */
function registeredmail(req, res, next) {
  sendEmailWithTemplate(req.body.reservationId, req, res, 'registeredmail');
}
/**
  * Send confirmation mail to reservation (POST)
  */
exports.confirmationMail = function (req, res, next) {
  var id = req.body.reservationId;
  Reservation.findOne({ _id: new ObjectId(id) }, reservationFound);
  function reservationFound(err, reservation){
    if(err){
      return res.status(400).send({ message: 'Reservation not found' });
    }
    if(reservation.enrolled){
      registeredmail(req, res, next);
    } else {
      reservmail(req, res, next);
    }
  }
};
  
/**
  * Generic method to send a email based on mailtemplate given
  */
function sendEmailWithTemplate(reservationId, req, res, mailtemplate, specifikContent, callback) {
  console.log('resid' + reservationId);
  console.log('mailtemplate' + mailtemplate);
  console.log('mailtemplate' + mailtemplate);
  Reservation.findOne({ _id: new ObjectId(reservationId) }, function(err, reservation){
    if(err || !reservation){
      return res.status(400).send({ error: true, message: 'Reservation not found. Failure sending email: ' + err });
    }
    console.log('Res Found');
    Arkadevent.findOne({ _id: new ObjectId(reservation.arkadevent) }, function(err, arkadevent){
      var template = arkadevent[mailtemplate];
      var hasResponded = false;
      console.log('event Found');
      MailController.sendTemplateEmail(template, reservation, res, mailingDone, specifikContent);
      function mailingDone(result){
        if(hasResponded){
          return;
        }
        hasResponded = true;
        if(typeof callback === 'function'){
          console.log('callback is functino');
          callback(result.error);
        } else {
          console.log('callback is not a function');
          if(result.error){
            return res.status(400).send({ message: result.message });
          } else {
            return res.status(200).send({ message: result.message });
          }
        }
      }
    });
  });
}

