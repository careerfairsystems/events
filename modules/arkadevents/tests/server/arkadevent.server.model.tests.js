'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Arkadevent = mongoose.model('Arkadevent');

/**
 * Globals
 */
var user,
  arkadevent;

/**
 * Unit tests
 */
describe('Arkadevent Model Unit Tests:', function() {
  beforeEach(function(done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'password'
    });

    user.save(function() {
      arkadevent = new Arkadevent({
        name: 'Arkadevent Name',
        user: user
      });

      done();
    });
  });

  describe('Method Save', function() {
    it('should be able to save without problems', function(done) {
      this.timeout(0);
      return arkadevent.save(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function(done) {
      arkadevent.name = '';

      return arkadevent.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function(done) {
    Arkadevent.remove().exec(function() {
      User.remove().exec(function() {
        done();
      });
    });
  });
});
