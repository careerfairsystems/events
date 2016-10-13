'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'ArkadeventsService',
  function ($scope, Authentication, ArkadeventsService) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    var vm = this;
    $scope.vm = vm;
    vm.events = [];
    vm.reservations = [];
    $scope.isAdmin = $scope.authentication.user.roles.indexOf("admin") >= 0;

    ArkadeventsService.query(getEventsDone);
    function getEventsDone (data){
      function dateHasntPassed(arkadevent){ return (new Date()).getTime() > (new Date(arkadevent.date)).getTime(); }
      vm.events = data.filter(dateHasntPassed);
      function addSeatsLeft(e){
        e.seatsLeft = e.nrofseats - e.seatstaken;
        e.seatsLeft = Math.max(e.seatsLeft, 0);
      }
      vm.events.forEach(addSeatsLeft);
    }
  }
]);
