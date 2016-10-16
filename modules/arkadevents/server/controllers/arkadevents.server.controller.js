'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
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
  }, res);
};

exports.offerSeatsOnEvent = offerSeatsOnEvent;
function offerSeatsOnEvent(arkadevent, offersDone, res){
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
    resOffer.forEach(updateDb);
    function updateDb(r){
      // Update to DB
      r.update({ _id: new ObjectId(r._id) }, { $set: { pending: true, offer: new Date() } }, function(err, affected, resp){
        if (err) { 
          return offersDone({ err: true, message: errorHandler.getErrorMessage(err) });
        } 
        count--;
        if(count <= 0){
          // Email the reservations and ask for accept/decline
          var offerSuccess = MailController.offerSpot(resOffer, arkadevent, res);
          if(offerSuccess){
            return offersDone({ err: false, message: 'Mail sent to reservation' });
          } else {
            return offersDone({ err: true, message: 'Mail not sent, failure' });
          }
        }
      });
    }
  });        
}
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
        function isUserSame(r) { return r.enrolled && idCompare(r.user, userId); }
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
