(function () {
  'use strict';

  angular
    .module('reminders')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Reminders',
      state: 'reminders',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'reminders', {
      title: 'List Reminders',
      state: 'reminders.list'
    });

    // Add the dropdown create item
    menuService.addSubMenuItem('topbar', 'reminders', {
      title: 'Create Reminder',
      state: 'reminders.create',
      roles: ['user']
    });
  }
}());
