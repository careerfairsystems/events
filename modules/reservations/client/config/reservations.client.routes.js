(function () {
  'use strict';

  angular
    .module('reservations')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('reservations', {
        abstract: true,
        url: '/reservations',
        template: '<ui-view/>'
      })
      .state('reservations.list', {
        url: '',
        templateUrl: 'modules/reservations/client/views/list-reservations.client.view.html',
        controller: 'ReservationsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Reservations List'
        }
      })
      .state('reservations.create', {
        url: '/create/:arkadeventId',
        templateUrl: 'modules/reservations/client/views/form-reservation.client.view.html',
        controller: 'ReservationsController',
        controllerAs: 'vm',
        resolve: {
          reservationResolve: newReservation,
          arkadeventResolve: getEvent
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Reservations Create'
        }
      })
      .state('reservations.edit', {
        url: '/:reservationId/edit',
        templateUrl: 'modules/reservations/client/views/form-reservation.client.view.html',
        controller: 'ReservationsController',
        controllerAs: 'vm',
        resolve: {
          reservationResolve: getReservation
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Edit Reservation {{ reservationResolve.name }}'
        }
      })
      .state('reservations.view', {
        url: '/:reservationId',
        templateUrl: 'modules/reservations/client/views/view-reservation.client.view.html',
        controller: 'ReservationsController',
        controllerAs: 'vm',
        resolve: {
          reservationResolve: getReservation,
          arkadeventResolve: function(){ return {}; }
        },
        data: {
          pageTitle: 'Reservation {{ reservationResolve.name }}'
        }
      });
  }

  getReservation.$inject = ['$stateParams', 'ReservationsService'];

  function getReservation($stateParams, ReservationsService) {
    return ReservationsService.get({
      reservationId: $stateParams.reservationId
    }).$promise;
  }

  newReservation.$inject = ['ReservationsService'];

  function newReservation(ReservationsService) {
    return new ReservationsService();
  }

  getEvent.$inject = ['$stateParams', 'ArkadeventsService'];

  function getEvent($stateParams, ArkadeventsService) {
    return ArkadeventsService.get({
      arkadeventId: $stateParams.arkadeventId
    }).$promise;
  }
}());
