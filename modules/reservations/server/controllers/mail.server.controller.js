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
  config = require(path.resolve('./config/config.js')),
  _ = require('lodash');
  
// Create smtpTransport for mailing.
var smtpTransport = nodemailer.createTransport(config.mailer.options);


/**
  * Send mail to offer a spot for a reservation
  */
exports.offerSpot = function (reservations, arkadevent, res){
  var template = path.resolve('modules/reservations/server/templates/offerseat');
  var content = 'Du har fått en plats ett av våra event, klicka på länken för att bekräfta eller tacka nej.\n\n' + config.host + '/reservations/offer/' + arkadevent._id.toString();
  var contact = 'event.arkad@box.tlth.se';
  var subject = 'En plats har öppnat sig! / A seat is available!';
  
  var count = reservations.length;
  var successfull = true;
  reservations.forEach(sendOfferEmail);
  function sendOfferEmail(r){
    sendMail(r, template, content, subject, contact, res, done);
    function done(err) {
      if(err){
        successfull = false;
        console.log("oh neas");
      }
      console.log("hej");
      if(count <= 0){
        console.log("Fuck");
        if (!err && successfull) {
          return res.send({ message: 'An email has been sent to the provided email with further instructions.' });
        } else {
          return res.status(400).send({ message: 'Failure sending email: ' + err });
        }
      }
      count--;
    }
  }
};

/**
  * Send confirmation mail to reservation
  */
exports.confirmationMail = function (reservationId, res) {
  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    return res.status(400).send({
      message: 'Reservation is invalid'
    });
  }
  Reservation.findById(reservationId).populate('user', 'displayName').exec(function (err, reservation) {
    if (err) {
      return res.status(404).send({ message: 'Error when retrieveng reservation: ' + err });
    } else if (!reservation) {
      return res.status(404).send({ message: 'No Reservation with that identifier has been found' });
    }
    var template = path.resolve('modules/reservations/server/templates/mailconfirmation');
    var content = 'Du har nu bokat en plats på ett event\n\n Om detta inte stämmer eller om vi har fått in fel uppgifter, hör av dig snarast. ';
    var contact = 'event.arkad@box.tlth.se';
    var subject = 'Bekräftelse Event anmälan / Confirmation Event booking';
    sendMail(reservation, template, content, subject, contact, res, done);
    function done(err) {
      if (!err) {
        return res.send({ message: 'An email has been sent to the provided email with further instructions.' });
      } else {
        return res.status(400).send({ message: 'Failure sending email: ' + err });
      }
    }
  });
};


/**
  * A generic method for sending mail to the student of a Reservation.
  */

function sendMail(reservation, template, content, subject, contact, res, callback){
  content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  async.waterfall([
    function (done) {
      var httpTransport = 'http://';
      if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https://';
      }
      res.render(template, {
        name: reservation.name,
        appName: config.app.title,
        content: content,
        contact: contact
      }, function (err, emailHTML) {
        done(err, emailHTML);
      });
    },
    // If valid email, send reset email using service
    function (emailHTML, done) {
      var mailOptions = {
        to: reservation.email,
        from: config.mailer.from,
        subject: subject,
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        callback(err);
        done(err);
      });
    }
  ], function (err) {
    callback(err);
  });

}
