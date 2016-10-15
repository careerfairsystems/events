(function () {
  'use strict';

  // Reservations Confirmation controller
  angular
    .module('reservations')
    .controller('ReservationsOfferController', ReservationsOfferController);

  ReservationsOfferController.$inject = ['$scope', '$http', 'arkadeventResolve', '$state'];

  function ReservationsOfferController ($scope, $http, arkadeventResolve, $state) {
    var vm = this;

    vm.arkadevent = arkadeventResolve;
    
    vm.decline = function(){
      $http.post('/api/reservations/decline', { arkadeventId: vm.arkadevent._id }).success(function (response) {
        // Show user success message 
        $scope.success = response.message;
        $scope.error = response.message;
        vm.redirect();
      }).error(function (response) {
        // Show user error message 
        $scope.error = response.message;
      });
    };
    vm.accept = function(){
      $http.post('/api/reservations/accept', { arkadeventId: vm.arkadevent._id }).success(function (response) {
        // Show user success message 
        $scope.success = response.message;
        $scope.error = response.message;
        vm.redirect();
      }).error(function (response) {
        // Show user error message 
        $scope.error = response.message;
      });
    };
    vm.redirect = function(){
      $state.go('home');
    };
  
    $scope.error = 'aeou';
  }
}());
