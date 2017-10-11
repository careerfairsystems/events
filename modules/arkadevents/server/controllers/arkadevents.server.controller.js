'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  config = require(path.resolve('./config/config')),
  Arkadevent = mongoose.model('Arkadevent'),
  Reservation = mongoose.model('Reservation'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  MailController = require(path.resolve('./modules/mailtemplates/server/controllers/mail.server.controller')),
  _ = require('lodash');

function idCompare(id1,id2){
  return JSON.stringify(id1) === JSON.stringify(id2);
}
/**
 * Create a Arkadevent
 */
exports.create = function(req, res) {
  var arkadevent = new Arkadevent(req.body);
  arkadevent.user = req.user;
  arkadevent.data = {};
  arkadevent.seatstaken = 0;
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
  var user = req.user;
  var userId = '';
  if(user){
    userId = user._id;
  }

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  arkadevent.isCurrentUserOwner = req.user && arkadevent.user && arkadevent.user._id.toString() === req.user._id.toString();

  Reservation.find({ arkadevent: new ObjectId(arkadevent._id), $or: [{ enrolled: true }, { standby: true }] }).exec(function(err, reservations){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    arkadevent.seatstaken = reservations.length;
    res.jsonp(arkadevent);
  });
};

/**
 * GetReservation
 */
exports.readreservation = function(req, res) {
  var arkadevent = req.arkadevent ? req.arkadevent.toJSON() : {};
  var user = req.user;
  var userId = '';
  var reservationState = {
    isPending: undefined,
    isEnrolled: undefined,
    isStandby: undefined,
    isRegistered: undefined,
  };
  if(user){
    userId = user._id;
  }
  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  arkadevent.isCurrentUserOwner = req.user && arkadevent.user && arkadevent.user._id.toString() === req.user._id.toString();
  Reservation.find({ arkadevent: new ObjectId(arkadevent._id), $or: [{ enrolled: true }, { standby: true }] }).exec(function(err, reservations){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var myReservation = reservations.filter(isUserSame);
    function isUserSame(r) { return (r.enrolled || r.standby) && idCompare(r.user, userId); }
    var isRegistered = myReservation.length > 0;
    if(isRegistered){
      myReservation = myReservation[0];
      reservationState.isPending = myReservation.pending;
      reservationState.isEnrolled = myReservation.enrolled;
      reservationState.isStandby = myReservation.standby;
    }
    reservationState.isRegistered = isRegistered;
    res.jsonp(reservationState);
  });
};

/**
 * Offer spot for stand-by reservations that fit on the event.
 */
exports.offerseats = function(req, res) {
  // Convert mongoose document to JSON
  var arkadevent = req.arkadevent ? req.arkadevent.toJSON() : {};
  var hasResponded = false;
  offerSeatsOnEvent(arkadevent, function(success){
    if(!hasResponded){
      if(success){
        res.status(200).send({ message: 'Succesfully sent email' }); 
      } else {
        res.status(400).send({ message: 'Failed to sent email' }); 
      }
      hasResponded = true;
    }
  }, res, req);
};

exports.offerSeatsOnEvent = offerSeatsOnEvent;
function offerSeatsOnEvent(arkadevent, offersDone, res, req){
  // Get all reservations to this event.
  Reservation.find({ arkadevent: new ObjectId(arkadevent._id) }).exec(function(err, reservations){
    if(err){
      return offersDone({ err: true, message: errorHandler.getErrorMessage(err) });
    }
    // Sort reservations after created-date
    function afterCreated(r1, r2) { return r1.created && r2.created && r1.created.getTime() > r2.created.getTime(); }
    var sortRes = reservations.sort(afterCreated);

    // Get reservations that should be offered a spot.
    var nrofseats = arkadevent.nrofseats;
    var resOffer = sortRes.reduce(resToOffer, []);
    function resToOffer (pre, reservation){
      if(nrofseats <= 0){
        return pre;
      }
      // Standby that hasnt been offered or enrolled.
      if(!reservation.enrolled && !reservation.pending && reservation.standby){
        pre.push(reservation);
      }
      nrofseats--;
      return pre;
    }
    if(resOffer.length <= 0){
      return offersDone({ err: false, message: 'No seats left for standbys. No other reservation has been enrolled' });
    }

    var count = resOffer.length;
    console.log('count' + count);
    var allSuccess = true;
    resOffer.forEach(updateDb);
    function updateDb(r){
      var offerCreated = new Date();
      // Update to DB
      Reservation.update({ _id: new ObjectId(r._id) }, { $set: { pending: true, offer: offerCreated } }, function(err, affected){
        if (err) { 
          return offersDone({ err: true, message: errorHandler.getErrorMessage(err) });
        } 
        count--;
        console.log('count--' + count);
        console.log('resp--' + JSON.stringify(affected));
        // Email the reservations and ask for accept/decline
        var offerSuccess = sendEmailWithArkadeventTemplate(arkadevent._id, r, req, res, 'seatofferedmail', specifikContent);
        if(!offerSuccess){
          allSuccess = false;
        }
        if(count <= 0){
          if(allSuccess){
            return offersDone({ err: false, message: 'Mail sent to reservation' });
          } else {
            return offersDone({ err: true, message: 'Mail not sent, failure' });
          }
        }
        function specifikContent(reservation){
          var str = '\n\n';
          str += 'Link to verify that you are still interested in attending the ' + arkadevent.name + ':\n';
          str += config.host + '/reservations/offer/' + reservation._id;
          str += '\n';
          return str;
        }
      });
    }
  });        
}

/**
  * Generic method to send a email based on mailtemplate given
  */
function sendEmailWithArkadeventTemplate(arkadeventId, reservation, req, res, mailtemplate, specifikContent) {
  Arkadevent.findOne({ _id: new ObjectId(arkadeventId) }, function(err, arkadevent){
    var template = arkadevent[mailtemplate];
    var hasResponded = false;
    MailController.sendTemplateEmail(template, reservation, res, mailingDone, specifikContent);
    function mailingDone(result){
      if(hasResponded){
        return;
      }
      hasResponded = true;
      return result.error;
    }
  });
}


/**
 * Update a Arkadevent
 */
exports.update = function(req, res) {
  var arkadevent = req.arkadevent;

  arkadevent = _.extend(arkadevent, req.body);
  arkadevent.data = {};
  arkadevent.seatstaken = 0;
  arkadevent.data = {};
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
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      arkadevents.forEach(function(a){ a.data = {}; });
      res.jsonp(arkadevents);
      /*
      Reservation.find({ $or: [{ enrolled: true }, { standby: true }] }).exec(function(err, reservations){
        if(err){
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        //reservations.forEach(goThroughReservations);
        function goThroughReservations(r){
          arkadevents.forEach(addReservationsData);
          function addReservationsData(e){
            function isUserSame(r) { return (r.standby || r.enrolled) && idCompare(r.user, userId); }
            if(idCompare(e._id, r.arkadevent)){
              e.data = !e.data ? {} : e.data;
              e.seatstaken = !e.seatstaken ? 1 : e.seatstaken + 1;
              if(isUserSame(r)){
                e.data.isRegistered = true;
              }
            }
          }
        }
      });
      */        
    }
  });
};

/*
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
