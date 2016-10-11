(function () {
  'use strict';

  // Reservations controller
  angular
    .module('reservations')
    .controller('ReservationsCheckController', ReservationsCheckController);

  ReservationsCheckController.$inject = ['$scope', '$state', '$window', 'Authentication', 'ReservationsService', 'arkadeventResolve', '$filter'];

  function ReservationsCheckController ($scope, $state, $window, Authentication, ReservationsService, arkadeventResolve, $filter) {
    var vm = this;

    vm.authentication = Authentication;
    vm.arkadevent = arkadeventResolve;
    //vm.reservation.arkadevent = vm.arkadevent._id;
    vm.error = null;
    vm.form = {};

    $scope.reservations = [];
    ReservationsService.query(function (data){
      function sameEvent(r) { return r.arkadevent === vm.arkadevent._id; }
      $scope.reservations = data.filter(sameEvent);
      $scope.filteredItems = $scope.reservations;
    });

    $scope.checkReservation = function(reservation){
      // TODO: Implement. Send data to server, on callback update color on list-item.
    };


    // Save Reservation
    function save(isValid) {
      vm.reservation.$update(successReservationCallback, errorCallback);
      function successReservationCallback(res) {
        vm.resId = res._id;
      }
      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.reservations, {
        $: $scope.search
      });
    };
  }
}());
