(function () {
  'use strict';

  angular
    .module('arkadevents')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Arkadevents',
      state: 'arkadevents',
      type: 'dropdown',
      roles: ['host', 'admin']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'arkadevents', {
      title: 'Check Reservations',
      state: 'arkadevents.check',
      roles: ['host', 'admin']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'arkadevents', {
      title: 'List Arkadevents',
      state: 'arkadevents.list',
      roles: ['admin']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'arkadevents', {
      title: 'List Foodpref',
      state: 'arkadevents.foodpref',
      roles: ['admin']
    });

    // Add the dropdown create item
    menuService.addSubMenuItem('topbar', 'arkadevents', {
      title: 'Create Arkadevent',
      state: 'arkadevents.create',
      roles: ['admin']
    });
  }
}());
