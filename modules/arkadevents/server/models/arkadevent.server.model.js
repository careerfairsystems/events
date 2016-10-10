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
    required: 'Please fill Arkadevent name',
    trim: true
  },
  image: {
    type: String,
    default: 'https://s-media-cache-ak0.pinimg.com/originals/5b/2a/0a/5b2a0a845e530ca0f2e38a954b3f4523.jpg'
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

mongoose.model('Arkadevent', ArkadeventSchema);
