(function () {
  'use strict';

  // Reservations controller
  angular
    .module('reservations')
    .controller('ReservationUnregisterController', ReservationUnregisterController);

  ReservationUnregisterController.$inject = ['$scope', '$state', 'Authentication', 'arkadeventResolve', 'Users', '$http'];

  function ReservationUnregisterController ($scope, $state, Authentication, arkadeventResolve, Users, $http) {
    var vm = this;

    vm.authentication = Authentication;
    vm.arkadevent = arkadeventResolve;
    vm.eventId = vm.arkadevent._id;
    vm.user = vm.authentication.user;

    $scope.unregister = function (){
      $http.post('/api/reservations/unregister', { arkadeventId: vm.eventId }).success(function (response) {
        // Successfull
        $state.go('home');
      }).error(function (response) {
        // Show user error message 
        $scope.error = response.message;
      });
    };

    // Save Reservation
    function save(isValid) {
      if (vm.reservation._id) {
        vm.reservation.$update(successReservationCallback, errorCallback);
      } else {
        vm.reservation.$save(successReservationCallback, errorCallback);
      }

      function successReservationCallback(res) {
        vm.resId = res._id;
      }
      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());
