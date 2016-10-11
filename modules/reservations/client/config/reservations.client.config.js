(function () {
  'use strict';

  angular
    .module('reservations')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Reservations',
      state: 'reservations',
      type: 'dropdown',
      roles: ['host', 'admin']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'reservations', {
      title: 'List Reservations',
      state: 'reservations.list'
    });
  }
}());
