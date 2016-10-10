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
  guild: {
    type: String,
    required: 'Please fill Guild'
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
    required: 'Please fill the email'
  },
  foodpref: {
    type: String,
    required: 'Please fill the food preferences'
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
  }
});

mongoose.model('Reservation', ReservationSchema);
