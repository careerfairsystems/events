(function () {
  'use strict';

  angular
    .module('arkadevents')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('arkadevents', {
        abstract: true,
        url: '/arkadevents',
        template: '<ui-view/>'
      })
      .state('arkadevents.list', {
        url: '',
        templateUrl: 'modules/arkadevents/client/views/list-arkadevents.client.view.html',
        controller: 'ArkadeventsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Arkadevents List'
        }
      })
      .state('arkadevents.create', {
        url: '/create',
        templateUrl: 'modules/arkadevents/client/views/form-arkadevent.client.view.html',
        controller: 'ArkadeventsController',
        controllerAs: 'vm',
        resolve: {
          arkadeventResolve: newArkadevent
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Arkadevents Create'
        }
      })
      .state('arkadevents.edit', {
        url: '/:arkadeventId/edit',
        templateUrl: 'modules/arkadevents/client/views/form-arkadevent.client.view.html',
        controller: 'ArkadeventsController',
        controllerAs: 'vm',
        resolve: {
          arkadeventResolve: getArkadevent
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Edit Arkadevent {{ arkadeventResolve.name }}'
        }
      })
      .state('arkadevents.view', {
        url: '/:arkadeventId',
        templateUrl: 'modules/arkadevents/client/views/view-arkadevent.client.view.html',
        controller: 'ArkadeventsController',
        controllerAs: 'vm',
        resolve: {
          arkadeventResolve: getArkadevent
        },
        data: {
          pageTitle: 'Arkadevent {{ arkadeventResolve.name }}'
        }
      });
  }

  getArkadevent.$inject = ['$stateParams', 'ArkadeventsService'];

  function getArkadevent($stateParams, ArkadeventsService) {
    return ArkadeventsService.get({
      arkadeventId: $stateParams.arkadeventId
    }).$promise;
  }

  newArkadevent.$inject = ['ArkadeventsService'];

  function newArkadevent(ArkadeventsService) {
    return new ArkadeventsService();
  }
}());
