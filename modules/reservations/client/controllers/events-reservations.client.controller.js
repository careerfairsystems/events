(function () {
  'use strict';

  angular
    .module('reservations')
    .controller('ReservationsEventsListController', ReservationsEventsListController);

  ReservationsEventsListController.$inject = ['ArkadeventsService'];

  function ReservationsEventsListController(ArkadeventsService) {
    var vm = this;
    vm.arkadevents = ArkadeventsService.query();
  }
}());
