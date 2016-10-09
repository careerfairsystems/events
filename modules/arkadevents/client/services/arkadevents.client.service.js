// Arkadevents service used to communicate Arkadevents REST endpoints
(function () {
  'use strict';

  angular
    .module('arkadevents')
    .factory('ArkadeventsService', ArkadeventsService);

  ArkadeventsService.$inject = ['$resource'];

  function ArkadeventsService($resource) {
    return $resource('api/arkadevents/:arkadeventId', {
      arkadeventId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
