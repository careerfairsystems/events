(function () {
  'use strict';

  // Arkadevents controller
  angular
    .module('arkadevents')
    .controller('ArkadeventsController', ArkadeventsController);

  ArkadeventsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'arkadeventResolve', 'MailtemplatesService'];

  function ArkadeventsController ($scope, $state, $window, Authentication, arkadevent, MailtemplatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.arkadevent = arkadevent;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.mailtemplates = MailtemplatesService.query();
    $scope.registeredmail = vm.arkadevent.registeredmail;
    $scope.reserv = vm.arkadevent.reservmail;
    $scope.unregistered = vm.arkadevent.unregisteredmail;
    $scope.seatoffered = vm.arkadevent.seatofferedmail;

    // Remove existing Arkadevent
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.arkadevent.$remove($state.go('arkadevents.list'));
      }
    }

    // Save Arkadevent
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'arkadeventForm');
        return false;
      }
 
      // Update with values from inputQuestions.... 
      vm.arkadevent.name = $scope.inputQuestions[0].variable;
      vm.arkadevent.photo = $scope.inputQuestions[1].variable;
      vm.arkadevent.location = $scope.inputQuestions[2].variable;
      vm.arkadevent.language = $scope.inputQuestions[3].variable;
      vm.arkadevent.typeoffood = $scope.inputQuestions[4].variable;
      vm.arkadevent.nrofseats = $scope.inputQuestions[5].variable;
      vm.arkadevent.date = $scope.inputQuestions[6].variable;
      vm.arkadevent.starttime = $scope.inputQuestions[7].variable;
      vm.arkadevent.endtime = $scope.inputQuestions[8].variable;
      vm.arkadevent.lastregistrationdate = $scope.inputQuestions[9].variable;

      // Set 'date's time to starttime
      vm.arkadevent.date.setHours(vm.arkadevent.starttime.getHours());
      vm.arkadevent.date.setMinutes(vm.arkadevent.starttime.getMinutes());
      vm.arkadevent.starttime = vm.arkadevent.date;
      // Set date of starttime and endtime
      var endTime = new Date();
      endTime.setTime(vm.arkadevent.date.getTime());
      endTime.setHours(vm.arkadevent.endtime.getHours());
      endTime.setMinutes(vm.arkadevent.endtime.getMinutes());
      vm.arkadevent.endtime = endTime;

      

      if($scope.registeredmail){
        vm.arkadevent.registeredmail = $scope.registeredmail;
      }
      if($scope.reserv){
        vm.arkadevent.reservmail = $scope.reserv;
      }
      if($scope.unregistered){
        vm.arkadevent.unregisteredmail = $scope.unregistered;
      }
      if($scope.seatoffered){
        vm.arkadevent.seatofferedmail = $scope.seatoffered;
      }


      // TODO: move create/update logic to service
      if (vm.arkadevent._id) {
        vm.arkadevent.$update(successCallback, errorCallback);
      } else {
        vm.arkadevent.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('arkadevents.list');
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }


    // Convert date-string to date-object
    function dtStrToObj(str){ return new Date(str); }
    var date = dtStrToObj(vm.arkadevent.date);
    var starttime = dtStrToObj(vm.arkadevent.starttime);
    var endtime = dtStrToObj(vm.arkadevent.endtime);
    var lastregistrationdate = dtStrToObj(vm.arkadevent.lastregistrationdate);

    // Create form-question Array
    $scope.inputQuestions = [ 
      { 
        name : 'name', 
        question : 'Name', 
        placeholder : '', 
        type : 'text', 
        variable : vm.arkadevent.name 
      }, { 
        name : 'photo', 
        question : 'Photo (url)', 
        placeholder : 'http://...', 
        type : 'text', 
        variable : vm.arkadevent.photo 
      }, { 
        name : 'location', 
        question : 'Location', 
        type : 'text', 
        variable : vm.arkadevent.location 
      }, { 
        name : 'language', 
        question : 'Language', 
        type : 'text', 
        variable : vm.arkadevent.language 
      }, { 
        name : 'typeoffood', 
        question : 'typeoffood', 
        type : 'text', 
        variable : vm.arkadevent.typeoffood 
      }, { 
        name : 'nrofseats', 
        question : 'Number of seats', 
        type : 'number', 
        variable : vm.arkadevent.nrofseats 
      }, { 
        name : 'date', 
        question : 'Date', 
        type : 'date', 
        variable : date 
      }, { 
        name : 'starttime', 
        question : 'Start time', 
        type : 'time', 
        variable : starttime 
      }, { 
        name : 'endtime', 
        question : 'End time', 
        type : 'time', 
        variable : endtime 
      }, { 
        name : 'lastregistrationdate', 
        question : 'Last date of registration', 
        type : 'date', 
        variable : lastregistrationdate 
      },
    ];





  }
}());
