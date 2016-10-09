(function () {
  'use strict';

  // Arkadevents controller
  angular
    .module('arkadevents')
    .controller('ArkadeventsController', ArkadeventsController);

  ArkadeventsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'arkadeventResolve'];

  function ArkadeventsController ($scope, $state, $window, Authentication, arkadevent) {
    var vm = this;

    vm.authentication = Authentication;
    vm.arkadevent = arkadevent;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Arkadevent
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.arkadevent.$remove($state.go('arkadevents.list'));
      }
    }

    // Save Arkadevent
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.arkadeventForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.arkadevent._id) {
        vm.arkadevent.$update(successCallback, errorCallback);
      } else {
        vm.arkadevent.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('arkadevents.view', {
          arkadeventId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());
