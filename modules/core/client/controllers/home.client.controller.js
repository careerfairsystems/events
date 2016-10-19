'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'ArkadeventsService', '$sce',
  function ($scope, Authentication, ArkadeventsService, $sce) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    var vm = this;
    $scope.vm = vm;
    vm.events = [];
    vm.reservations = [];
    $scope.isAdmin = false;
    if($scope.authentication.user){
      $scope.isAdmin = $scope.authentication.user.roles.indexOf('admin') >= 0;
    }
    ArkadeventsService.query(getEventsDone);
    function getEventsDone (data){
      function dateHasntPassed(arkadevent){ return (new Date()).getTime() < (new Date(arkadevent.date)).getTime(); }
      vm.events = data.filter(dateHasntPassed);
      function addSeatsLeft(e){
        e.seatsLeft = e.nrofseats - e.seatstaken;
        e.seatsLeft = Math.max(e.seatsLeft, 0);
        
        // Trim description
        var maxLength = 180;
        var trimmedString = e.description.substr(0, maxLength);
        trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
        e.description = trimmedString + '...';

        //Make description to html
        e.description = e.description.replace(/(?:\r\n|\r|\n)/g, '<br />');
        e.description = $sce.trustAsHtml(e.description);
      }
      vm.events.forEach(addSeatsLeft);
    }
  }
]);
