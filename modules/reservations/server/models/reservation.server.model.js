'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Reservation Schema
 */
var ReservationSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill Reservation name',
    trim: true
  },
  program: {
    type: String,
    required: 'Please fill program',
    default: ''
  },
  year: {
    type: String,
    required: 'Please fill year'
  },
  email: {
    type: String,
    required: 'Please fill the email'
  },
  phone: {
    type: String,
    required: 'Please fill the phonenumber'
  },
  foodpref: [{
    type: String,
  }],
  other: {
    type: String,
  },
  showedup: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now
  },
  arkadevent: {
    type: Schema.ObjectId,
    ref: 'Arkadevent'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  enrolled: {
    type: Boolean,
    default: false
  },
  standby: {
    type: Boolean,
    default: false
  },
  pending: {
    type: Boolean,
    default: false
  },
  offer: {
    type: Date,
    default: new Date()
  }
});

mongoose.model('Reservation', ReservationSchema);
