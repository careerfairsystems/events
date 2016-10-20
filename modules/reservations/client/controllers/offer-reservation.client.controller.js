(function () {
  'use strict';

  // Reservations Confirmation controller
  angular
    .module('reservations')
    .controller('ReservationsOfferController', ReservationsOfferController);

  ReservationsOfferController.$inject = ['$scope', '$http', '$state', 'reservationResolve', 'ArkadeventsService'];

  function ReservationsOfferController ($scope, $http, $state, reservationResolve, ArkadeventsService) {
    var vm = this;

    vm.reservation = reservationResolve;
    ArkadeventsService.query(function(data){
      function sameEvent(e){ return e._id === vm.reservation.arkadevent; }
      vm.arkadevent = data.filter(sameEvent)[0];
    });
    
    vm.decline = function(){
      $http.post('/api/reservations/decline', { reservationId: vm.reservation._id }).success(function (response) {
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
      $http.post('/api/reservations/accept', { reservationId: vm.reservation._id }).success(function (response) {
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
  }
}());
