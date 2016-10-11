(function () {
  'use strict';

  // Reservations controller
  angular
    .module('reservations')
    .controller('ReservationsController', ReservationsController);

  ReservationsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'reservationResolve', 'arkadeventResolve'];

  function ReservationsController ($scope, $state, $window, Authentication, reservation, arkadeventResolve) {
    var vm = this;

    vm.authentication = Authentication;
    vm.reservation = reservation;
    vm.arkadevent = arkadeventResolve;
    vm.reservation.arkadevent = vm.arkadevent._id;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Reservation
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.reservation.$remove($state.go('reservations.list'));
      }
    }

    // Save Reservation
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.reservationForm');
        return false;
      }

      var food_arr = [];
      if($scope.laktos) 
        food_arr.push('Laktos');
      if($scope.vegetarian) 
        food_arr.push('Vegetarian');
      if($scope.vegan) 
        food_arr.push('Vegan');
      if($scope.gluten) 
        food_arr.push('Gluten');
      if($scope.other) 
        food_arr.push($scope.other);
      vm.reservation.foodpref = food_arr.join();

      // TODO: move create/update logic to service
      if (vm.reservation._id) {
        vm.reservation.$update(successCallback, errorCallback);
      } else {
        vm.reservation.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('reservations.view', {
          reservationId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());
