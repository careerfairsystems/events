(function () {
  'use strict';

  // Reservations Confirmation controller
  angular
    .module('reservations')
    .controller('ReservationsConfirmationController', ReservationsConfirmationController);

  ReservationsConfirmationController.$inject = ['$scope', '$http', '$stateParams'];

  function ReservationsConfirmationController ($scope, $http, $stateParams) {
    var vm = this;

    vm.resId = $stateParams.reservationId;
    
    $http.post('/api/reservations/confirmationmail', { reservationId: vm.resId }).success(function (response) {
      // Show user success message 
      $scope.success = response.message;
      $scope.error = response.message;
    }).error(function (response) {
      // Show user error message 
      $scope.error = response.message;
    });
  
  }
}());
