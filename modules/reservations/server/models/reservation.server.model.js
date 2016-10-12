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
  /* true if reservation has been accepted and the person has accepted the spot (is set to false at unregistration)*/
  enrolled: {
    type: Boolean
  },
  /* true if the reservation was on standby and the person has not been offered a spot */
  standby: {
    type: Boolean
  },
  /* true if has been offered a spot as stand-by but not yet replied */
  pending: {
    type: Boolean
  },
  /* date when place was offered (set to time when reservation was made if reservation was not on stand-by) */
  offer: {
    type: Date
  }
});

mongoose.model('Reservation', ReservationSchema);
