(function () {
  'use strict';

  angular
    .module('reminders')
    .controller('RemindersListController', RemindersListController);

  RemindersListController.$inject = ['RemindersService'];

  function RemindersListController(RemindersService) {
    var vm = this;

    vm.reminders = RemindersService.query();
  }
}());
