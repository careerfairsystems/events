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

    //Calc if late reservation.
    vm.arkadevent.deadline = (new Date(vm.arkadevent.lastregistrationdate)).getTime();

    $scope.reservations = [];
    ReservationsService.query(function (data){
      function sameEvent(r) { return r.arkadevent === vm.arkadevent._id; }
      function minimizeObject(r){ return { _id: r._id, name: r.name, showedup: r.showedup, foodpref: r.foodpref, time: (new Date(r.created).getTime()) }; }
      $scope.reservations = data.filter(sameEvent).map(minimizeObject);
      $scope.filteredItems = $scope.reservations;
    });

    $scope.checkReservation = function(reservation){
      // TODO: Implement. Send data to server, on callback update color on list-item.
      reservation.showedup = !reservation.showedup;
      reservation.edit = false;
      updateReservation(reservation);
    };

    function updateReservation(reservation){
      var res = ReservationsService.get({ reservationId: reservation._id }, function() {
        res.showedup = reservation.showedup;
        res.$save();
      });
    }



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
