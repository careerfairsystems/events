'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Arkadevent Schema
 */
var ArkadeventSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill in a name for the event.',
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  data: {},
  location: {
    type: String,
    required: 'Please fill in a location for the event.'
  },
  language: {
    type: String,
    required: 'Please pick a language for the event.'
  },
  description: {
    type: String,
    required: 'Please fill in a description for the event.'
  },
  seatstaken: {
    type: Number,
  },
  nrofseats: {
    type: Number,
    required: 'Please fill in the maximum number of seats.'
  },
  foodserved: {
    type: Boolean,
    default: false
  },
  typeoffood: {
    type: String
  },
  date: {
    type: Date,
    required: 'Pick a date for the event.'
  },
  starttime: {
    type: Date,
    required: 'Pick a start time for the event.'
  },
  endtime: {
    type: Date,
    requred: 'Pick an end time for the event.'
  },
  lastregistrationdate: {
    type: Date,
    requred: 'Pick a last registration date for the event.'
  },
  registeredmail: {
    type: Schema.ObjectId,
    ref: 'Mailtemplate'
  },
  reservmail: {
    type: Schema.ObjectId,
    ref: 'Mailtemplate'
  },
  unregisteredmail: {
    type: Schema.ObjectId,
    ref: 'Mailtemplate'
  },
  seatofferedmail: {
    type: Schema.ObjectId,
    ref: 'Mailtemplate'
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  public: {
    type: Boolean,
    default: false
  },
  reservationopen: {
    type: Boolean,
    default: false
  }
});

mongoose.model('Arkadevent', ArkadeventSchema);
