(function () {
  'use strict';

  angular
    .module('arkadevents')
    .controller('ArkadeventsListController', ArkadeventsListController);

  ArkadeventsListController.$inject = ['ArkadeventsService'];

  function ArkadeventsListController(ArkadeventsService) {
    var vm = this;

    vm.arkadevents = ArkadeventsService.query();
  }
}());
