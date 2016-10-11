(function () {
  'use strict';

  // Reservations controller
  angular
    .module('reservations')
    .controller('ReservationsController', ReservationsController);

  ReservationsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'reservationResolve', 'arkadeventResolve', 'Users'];

  function ReservationsController ($scope, $state, $window, Authentication, reservation, arkadeventResolve, Users) {
    var vm = this;

    vm.authentication = Authentication;
    vm.reservation = reservation;
    vm.arkadevent = arkadeventResolve;
    vm.reservation.arkadevent = vm.arkadevent._id;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.user = vm.authentication.user;

    loadUserData();
    function loadUserData(){
      vm.reservation.name = vm.user.displayName;
      vm.reservation.phone = vm.user.phone;
      vm.reservation.email = vm.user.email;
      vm.reservation.foodpref = vm.user.foodpref;
      vm.reservation.guild = vm.user.guild;
      vm.reservation.year = vm.user.year;
    }
    function saveDataToUser(){
      vm.user.displayName = vm.reservation.name;
      var name = vm.reservation.name.split(" ");
      vm.user.firstName = name[0];
      vm.user.lastName = name.slice(1).join(" ");
      vm.user.phone = vm.reservation.phone;
      vm.user.email = vm.reservation.email;
      vm.user.foodpref = vm.reservation.foodpref;
      vm.user.guild = vm.reservation.guild;
      vm.user.year = vm.reservation.year;

      var myUser = new Users(vm.user);
      myUser.$update(successUserCallback, errorCallback);
    }

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
      vm.reservation.foodpref = food_arr;

      // TODO: move create/update logic to service
      if (vm.reservation._id) {
        vm.reservation.$update(successReservationCallback, errorCallback);
      } else {
        vm.reservation.$save(successReservationCallback, errorCallback);
      }

      function successReservationCallback(res) {
        vm.resId = res._id;
        saveDataToUser();
      }
    }
    function errorCallback(res) {
      vm.error = res.data.message;
    }
    function successUserCallback(res) {
      $state.go('reservations.view', {
        reservationId: vm.resId
      });
    }
  }
}());
