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

    var allPrograms = ['Byggteknik med arkitektur / Civil Engineering - Architecture',
                  'Arkitekt / Architect',
                  'Arkitekt / Architect',
                  'Medicin och teknik / Biomedical Engineering',
                  'Bioteknik / Biotechnology',
                  'Bioteknik / Biotechnology',
                  'Kemiteknik / Chemical Engineering',
                  'Kemiteknik / Chemical Engineering',
                  'Brandingenjörsutbildning / Fire Protection Engineering',
                  'Brandingenjörsutbildning / Fire Protection Engineering',
                  'Byggteknik med arkitektur / Civil Engineering - Architecture',
                  'Byggteknik med järnvägsteknik / Civil Engineering - Railway Construction',
                  'Byggteknik med järnvägsteknik / Civil Engineering - Railway Construction',
                  'Civil Engineering- Road and Traffic Technology / Civil Engineering- Road and Traffic Technology',
                  'Civil Engineering- Road and Traffic Technology / Civil Engineering- Road and Traffic Technology',
                  'Väg- och vattenbyggnad / Civil Engineering',
                  'Väg- och vattenbyggnad / Civil Engineering',
                  'Datateknik / Computer Science and Engineering',
                  'Datateknik / Computer Science and Engineering',
                  'Informations- och kommunikationsteknik / Information and Communication Engineering',
                  'Informations- och kommunikationsteknik / Information and Communication Engineering',
                  'Ekosystemteknik / Environmental Engineering',
                  'Elektroteknik / Electrical Engineering',
                  'Elektroteknik / Electrical Engineering',
                  'Teknisk Matematik / Engineering Mathematics',
                  'Teknisk Nanovetenskap / Engineering Nanoscience',
                  'Teknisk Fysik / Engineering Physics',
                  'Teknisk Matematik / Engineering Mathematics',
                  'Teknisk Fysik / Engineering Physics',
                  'Teknisk Nanovetenskap / Engineering Nanoscience',
                  'Ekosystemteknik / Environmental Engineering',
                  'Industridesign / Industrial Design',
                  'Industriell ekonomi / Industrial Engineering and Management',
                  'Industridesign / Industrial Design',
                  'Industriell ekonomi / Industrial Engineering and Management',
                  'Lantmäteri / Surveying',
                  'Maskinteknik med teknisk design / Mechanical Engineering with Industrial Design',
                  'Maskinteknik med teknisk design / Mechanical Engineering with Industrial Design',
                  'Maskinteknik / Mechanical Engineering',
                  'Maskinteknik / Mechanical Engineering',
                  'Medicin och teknik / Biomedical Engineering',
                  'Lantmäteri / Surveying'];
    var set = new Set(allPrograms);
    $scope.programs = Array.from(set);
    
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
      $scope.laktos = vm.reservation.foodpref.indexOf('Laktos') >= 0;
      $scope.vegetarian = vm.reservation.foodpref.indexOf('Vegetarian') >= 0;
      $scope.vegan = vm.reservation.foodpref.indexOf('Vegan') >= 0;
      $scope.gluten = vm.reservation.foodpref.indexOf('Gluten') >= 0;
      $scope.other = vm.reservation.other;
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
      vm.reservation.foodpref = food_arr;
      vm.reservation.other = $scope.other;

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
