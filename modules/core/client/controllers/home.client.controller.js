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
      vm.events = data;
    }
  }
]);
