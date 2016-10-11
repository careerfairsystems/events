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
  reminders: [{
    reminder: Schema.ObjectId,
    hoursbeforeevent: Number
  }],
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
  applicationopen: {
    type: Boolean,
    default: false
  }
});

mongoose.model('Arkadevent', ArkadeventSchema);
