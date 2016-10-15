'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Arkadevents Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/arkadevents',
      permissions: '*'
    }, {
      resources: '/api/arkadevents/offerseats/:arkadeventId',
      permissions: '*'
    }, {
      resources: '/api/arkadevents/:arkadeventId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/arkadevents',
      permissions: ['get']
    }, {
      resources: '/api/arkadevents/:arkadeventId',
      permissions: ['get']
    }, {
      resources: '/api/arkadevents/offerseats/:arkadeventId',
      permissions: 'get'
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/arkadevents',
      permissions: ['get']
    }, {
      resources: '/api/arkadevents/:arkadeventId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Arkadevents Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Arkadevent is being processed and the current user created it then allow any manipulation
  if (req.arkadevent && req.user && req.arkadevent.user && req.arkadevent.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
