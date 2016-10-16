/* global $:false */
(function () {
  'use strict';

  angular
    .module('reservations')
    .controller('ReservationsMailController', ReservationsMailController);

  ReservationsMailController.$inject = ['ArkadeventsService', 'ReservationsService', '$http'];

  function ReservationsMailController(ArkadeventsService, ReservationsService, $http) {
    var vm = this;

    vm.arkadevents = ArkadeventsService.query();

    vm.allReservations = ReservationsService.query();

    vm.eventSelected = function(index){
      vm.arkadevent = vm.arkadevents[index];
      function isReservationForThisEvent(reservation){ return reservation.arkadevent === vm.arkadevent._id; }
      vm.reservations = vm.allReservations.filter(isReservationForThisEvent);
    };

    vm.eventDeselected = function(){
      vm.arkadevent = undefined;
    };
/*
    vm.setEnrollment = function(index){
      if(vm.reservations[index].enrolled){
        vm.deregister(index);
      } else {
        vm.enroll(index);
      }
    };
    // Deregister reservation
    vm.deregister = function (index){
      var imSure = window.confirm('Are you sure you want to deregister reservation from this event?');
      if(imSure){
        vm.reservations[index].enrolled = false;
        var reservation = vm.reservations[index];
        $http.post('/api/reservations/unregisterbyadmin', { arkadeventId: reservation.arkadevent, userId: reservation.user._id }).success(function (response) {
          alert('Succesfully deregistered student. Message: ' + response.message);
        }).error(function (response) {
          alert('Deregistration failed. Message: ' + response.message);
          vm.reservations[index].enrolled = true;
        });
      }
    };
  
    // Enroll reservation
    vm.enroll = function (index){
      var imSure = window.confirm('Are you sure you want to enroll reservation to event?');
      if(imSure){
        vm.reservations[index].enrolled = true;
        var reservation = vm.reservations[index];
        var res = ReservationsService.get({ reservationId: reservation._id }, function() {
          res.enrolled = reservation.enrolled;
          res.$save(function(r){
            alert("Succesfully enrolled reservation.");
          });
        });
      }
    };
*/
  }
}());
