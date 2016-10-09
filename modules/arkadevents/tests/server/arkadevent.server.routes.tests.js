'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Arkadevent = mongoose.model('Arkadevent'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  arkadevent;

/**
 * Arkadevent routes tests
 */
describe('Arkadevent CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Arkadevent
    user.save(function () {
      arkadevent = {
        name: 'Arkadevent name'
      };

      done();
    });
  });

  it('should be able to save a Arkadevent if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Arkadevent
        agent.post('/api/arkadevents')
          .send(arkadevent)
          .expect(200)
          .end(function (arkadeventSaveErr, arkadeventSaveRes) {
            // Handle Arkadevent save error
            if (arkadeventSaveErr) {
              return done(arkadeventSaveErr);
            }

            // Get a list of Arkadevents
            agent.get('/api/arkadevents')
              .end(function (arkadeventsGetErr, arkadeventsGetRes) {
                // Handle Arkadevents save error
                if (arkadeventsGetErr) {
                  return done(arkadeventsGetErr);
                }

                // Get Arkadevents list
                var arkadevents = arkadeventsGetRes.body;

                // Set assertions
                (arkadevents[0].user._id).should.equal(userId);
                (arkadevents[0].name).should.match('Arkadevent name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Arkadevent if not logged in', function (done) {
    agent.post('/api/arkadevents')
      .send(arkadevent)
      .expect(403)
      .end(function (arkadeventSaveErr, arkadeventSaveRes) {
        // Call the assertion callback
        done(arkadeventSaveErr);
      });
  });

  it('should not be able to save an Arkadevent if no name is provided', function (done) {
    // Invalidate name field
    arkadevent.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Arkadevent
        agent.post('/api/arkadevents')
          .send(arkadevent)
          .expect(400)
          .end(function (arkadeventSaveErr, arkadeventSaveRes) {
            // Set message assertion
            (arkadeventSaveRes.body.message).should.match('Please fill Arkadevent name');

            // Handle Arkadevent save error
            done(arkadeventSaveErr);
          });
      });
  });

  it('should be able to update an Arkadevent if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Arkadevent
        agent.post('/api/arkadevents')
          .send(arkadevent)
          .expect(200)
          .end(function (arkadeventSaveErr, arkadeventSaveRes) {
            // Handle Arkadevent save error
            if (arkadeventSaveErr) {
              return done(arkadeventSaveErr);
            }

            // Update Arkadevent name
            arkadevent.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Arkadevent
            agent.put('/api/arkadevents/' + arkadeventSaveRes.body._id)
              .send(arkadevent)
              .expect(200)
              .end(function (arkadeventUpdateErr, arkadeventUpdateRes) {
                // Handle Arkadevent update error
                if (arkadeventUpdateErr) {
                  return done(arkadeventUpdateErr);
                }

                // Set assertions
                (arkadeventUpdateRes.body._id).should.equal(arkadeventSaveRes.body._id);
                (arkadeventUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Arkadevents if not signed in', function (done) {
    // Create new Arkadevent model instance
    var arkadeventObj = new Arkadevent(arkadevent);

    // Save the arkadevent
    arkadeventObj.save(function () {
      // Request Arkadevents
      request(app).get('/api/arkadevents')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Arkadevent if not signed in', function (done) {
    // Create new Arkadevent model instance
    var arkadeventObj = new Arkadevent(arkadevent);

    // Save the Arkadevent
    arkadeventObj.save(function () {
      request(app).get('/api/arkadevents/' + arkadeventObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', arkadevent.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Arkadevent with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/arkadevents/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Arkadevent is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Arkadevent which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Arkadevent
    request(app).get('/api/arkadevents/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Arkadevent with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Arkadevent if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Arkadevent
        agent.post('/api/arkadevents')
          .send(arkadevent)
          .expect(200)
          .end(function (arkadeventSaveErr, arkadeventSaveRes) {
            // Handle Arkadevent save error
            if (arkadeventSaveErr) {
              return done(arkadeventSaveErr);
            }

            // Delete an existing Arkadevent
            agent.delete('/api/arkadevents/' + arkadeventSaveRes.body._id)
              .send(arkadevent)
              .expect(200)
              .end(function (arkadeventDeleteErr, arkadeventDeleteRes) {
                // Handle arkadevent error error
                if (arkadeventDeleteErr) {
                  return done(arkadeventDeleteErr);
                }

                // Set assertions
                (arkadeventDeleteRes.body._id).should.equal(arkadeventSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Arkadevent if not signed in', function (done) {
    // Set Arkadevent user
    arkadevent.user = user;

    // Create new Arkadevent model instance
    var arkadeventObj = new Arkadevent(arkadevent);

    // Save the Arkadevent
    arkadeventObj.save(function () {
      // Try deleting Arkadevent
      request(app).delete('/api/arkadevents/' + arkadeventObj._id)
        .expect(403)
        .end(function (arkadeventDeleteErr, arkadeventDeleteRes) {
          // Set message assertion
          (arkadeventDeleteRes.body.message).should.match('User is not authorized');

          // Handle Arkadevent error error
          done(arkadeventDeleteErr);
        });

    });
  });

  it('should be able to get a single Arkadevent that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Arkadevent
          agent.post('/api/arkadevents')
            .send(arkadevent)
            .expect(200)
            .end(function (arkadeventSaveErr, arkadeventSaveRes) {
              // Handle Arkadevent save error
              if (arkadeventSaveErr) {
                return done(arkadeventSaveErr);
              }

              // Set assertions on new Arkadevent
              (arkadeventSaveRes.body.name).should.equal(arkadevent.name);
              should.exist(arkadeventSaveRes.body.user);
              should.equal(arkadeventSaveRes.body.user._id, orphanId);

              // force the Arkadevent to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Arkadevent
                    agent.get('/api/arkadevents/' + arkadeventSaveRes.body._id)
                      .expect(200)
                      .end(function (arkadeventInfoErr, arkadeventInfoRes) {
                        // Handle Arkadevent error
                        if (arkadeventInfoErr) {
                          return done(arkadeventInfoErr);
                        }

                        // Set assertions
                        (arkadeventInfoRes.body._id).should.equal(arkadeventSaveRes.body._id);
                        (arkadeventInfoRes.body.name).should.equal(arkadevent.name);
                        should.equal(arkadeventInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Arkadevent.remove().exec(done);
    });
  });
});
