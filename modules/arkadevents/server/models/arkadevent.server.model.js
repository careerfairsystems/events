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
    requried: 'Please fill in if food will be served at the event.'
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
  enrolled: [
    Schema.ObjectId
  ],
  standby: [
    Schema.ObjectId
  ],
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Arkadevent', ArkadeventSchema);
