(function () {
  'use strict';

  // Reservations controller
  angular
    .module('reservations')
    .controller('ReservationsController', ReservationsController);

  ReservationsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'reservationResolve', 'arkadeventResolve', 'Users', 'ProgramsService', '$http'];

  function ReservationsController ($scope, $state, $window, Authentication, reservation, arkadeventResolve, Users, ProgramsService, $http) {
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

    vm.spotsLeft = vm.arkadevent.nrofseats - vm.arkadevent.seatstaken;
    vm.hasSeatsLeft = vm.spotsLeft > 0;

    //Calc if late reservation.
    var today = new Date();
    vm.tooLate = false;
    if(vm.arkadevent.lastregistrationdate){
      vm.tooLate = today.getTime() > (new Date(vm.arkadevent.lastregistrationdate).getTime());
    }

    // Get all programs
    var programsSet = new Set(ProgramsService);
    vm.programs = [];
    programsSet.forEach(function(v){ vm.programs.push(v); });
    
    loadUserData();
    function loadUserData(){
      vm.reservation.name = vm.user.displayName;
      vm.reservation.phone = vm.user.phone;
      vm.reservation.email = vm.user.email;
      vm.reservation.foodpref = vm.user.foodpref;
      vm.reservation.other = vm.user.other;
      vm.reservation.guild = vm.user.guild;
      vm.reservation.year = vm.user.year;
      vm.reservation.program = vm.user.program;
    }
    function saveDataToUser(){
      vm.user.displayName = vm.reservation.name;
      var name = vm.reservation.name.split(' ');
      vm.user.firstName = name[0];
      vm.user.lastName = name.slice(1).join(' ');
      vm.user.phone = vm.reservation.phone;
      vm.user.email = vm.reservation.email;
      vm.user.foodpref = vm.reservation.foodpref;
      vm.user.other = vm.reservation.other;
      vm.user.guild = vm.reservation.guild;
      vm.user.year = vm.reservation.year;
      vm.user.program = vm.reservation.program;

      var myUser = new Users(vm.user);
      myUser.$update(successUserCallback, errorCallback);
    }
    fillFoodPref();
    function fillFoodPref(){
      vm.laktos = vm.reservation.foodpref.indexOf('Laktos') >= 0;
      vm.vegetarian = vm.reservation.foodpref.indexOf('Vegetarian') >= 0;
      vm.vegan = vm.reservation.foodpref.indexOf('Vegan') >= 0;
      vm.gluten = vm.reservation.foodpref.indexOf('Gluten') >= 0;
      vm.other = vm.reservation.other;
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
      if(vm.laktos) 
        food_arr.push('Laktos');
      if(vm.vegetarian) 
        food_arr.push('Vegetarian');
      if(vm.vegan) 
        food_arr.push('Vegan');
      if(vm.gluten) 
        food_arr.push('Gluten');
      vm.reservation.foodpref = food_arr;
      vm.reservation.other = vm.other;

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
      $state.go('reservations.confirmation', {
        reservationId: vm.resId
      });
    }

    // Show message in 10 sec
    vm.showMessage = function (message){
      $scope.message = message;
      setTimeout(function(){ 
        $scope.message = undefined; 
        $scope.$apply();
      }, 10000);
    };

    // If is pending
    vm.decline = function(){
      $http.post('/api/reservations/decline', { reservationId: vm.reservation._id, userId: vm.user._id, arkadeventId: vm.arkadevent._id }).success(function (response) {
        // Show user success message 
        vm.showMessage('Successfully accepted the seat');
        vm.redirect();
      }).error(function (response) {
        // Show user error message 
        vm.showMessage('Unsuccessfully declined seat... ' + response.message);
      });
    };
    vm.accept = function(){
      $http.post('/api/reservations/accept', { reservationId: vm.reservation._id, userId: vm.user._id, arkadeventId: vm.arkadevent._id }).success(function (response) {
        // Show user success message 
        vm.showMessage('Successfully accepted the seat');
        vm.redirect();
      }).error(function (response) {
        // Show user error message 
        vm.showMessage('Unsuccessfully accepted seat... ' + response.message);
      });
    };
    vm.redirect = function(){
      $state.go('home');
    };

  }
}());
