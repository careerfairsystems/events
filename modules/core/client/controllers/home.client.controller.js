'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'ArkadeventsService',
  function ($scope, Authentication, ArkadeventsService) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    var vm = this;
    $scope.vm = vm;
    vm.events = [];
    vm.reservations = [];

    ArkadeventsService.query(getEventsDone);
    function getEventsDone (data){
      vm.events = data;
      //ReservationsService.query(getReservationsDone);
    }
    /*
    function getReservationsDone (data){
      vm.reservations = data;
      getDataDone();
    }
    */

    function getDataDone(){
      vm.events.forEach(calcSpotsLeft);
    }

    function calcSpotsLeft(e){
      e.spotsLeft = Math.max(vm.reservations.reduce(reservedSpots, e.nrofseats || 0), 0);
      function reservedSpots(pre, curr){ return pre - (curr.arkadevent === e._id); }
    }

    function goToEvent(){
      // TODO: Implement
    }

    function reservlistToEvent(){
      // TODO: Implement
    }

  }
]);
