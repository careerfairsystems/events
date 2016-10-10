'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Reminder Schema
 */
var ReminderSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill Reminder name',
    trim: true
  },
  emailtitle: {
    type: String,
    required: 'Please add an email title.'
  },
  emailbody: {
    type: String,
    required: 'Please add a message to be sent in the reminder-email'
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Reminder', ReminderSchema);
