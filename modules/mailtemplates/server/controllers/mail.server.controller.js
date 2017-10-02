'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Reservation = mongoose.model('Reservation'),
  Mailtemplate = mongoose.model('Mailtemplate'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  app = require(path.resolve('./server')).app,
  config = require(path.resolve('./config/config.js')),
  _ = require('lodash');
  
// Create smtpTransport for mailing.
var smtpTransport = nodemailer.createTransport(config.mailer.options);


/**
  * Send mail With template
  */
exports.sendTemplateEmail = function (mailtemplateId, reservation, res, doneMail, specifikContent){

  Mailtemplate.findOne({ _id: new ObjectId(mailtemplateId) }, mailtemplateFound); 

  function mailtemplateFound(err, mailtemplate){
    if(err || !mailtemplate){
      return doneMail({ error: true, message: 'Mailtemplate not found. Failure sending email: ' + err });
    }
    console.log('send mail');    
    // Get variables    
    var template = path.resolve('modules/mailtemplates/server/templates/email');
    var content = mailtemplate.content + "\n\n" + 
		  mailtemplate.signature || '';
    var subject = mailtemplate.subject || '';

    if (typeof specifikContent === 'function') { 
      console.log('spec content');    
      content += specifikContent(reservation);
    }
    sendMail(reservation, template, content, subject, done, res);
    function done(err) {
      var success = err === null;
      console.log('DONE IS CALLED');
      if(success){
        return doneMail({ error: false, message: 'Mail succeessfully sent' });
      } else {
        return doneMail({ error: true, message: 'Failure sending email: ' + err });
      }
    }
  }
};

/**
  * A generic method for sending mail to the student of a Reservation.
  */

function sendMail(reservation, template, content, subject, callback, res){
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
        console.log('Email sent to: ' + reservation.email);
        done(err);
      });
    }
  ], function (err) {
    callback(err);
  });
}
