/* global $:false */
(function () {
  'use strict';

  angular
    .module('reservations')
    .controller('ReservationsListController', ReservationsListController);

  ReservationsListController.$inject = ['ReservationsService', '$stateParams', 'ArkadeventsService', '$state', '$filter', '$scope', '$compile'];

  function ReservationsListController(ReservationsService, $stateParams, ArkadeventsService, $state, $filter, $scope, $compile) {
    var vm = this;

    var eventId = $stateParams.arkadeventId;
    vm.arkadevent = ArkadeventsService.get({ arkadeventId: eventId });


    vm.reservations = ReservationsService.query(function (data){
      function isReservationForThisEvent(reservation){ return reservation.arkadevent === eventId; }
      vm.reservations = data.filter(isReservationForThisEvent);
      vm.reservations.$resolved = true;
      angular.forEach(vm.reservations, function(reservation, key) {
        reservation.nr = 1 + key;
        reservation.date = $filter('date')(reservation.created, 'yyyy-MM-dd');
        reservation.pending = reservation.pending || false;
        reservation.offer = reservation.offer || false;
        reservation.enrolled = reservation.enrolled || false;
        reservation.standby = reservation.standby || false;
        reservation.program = reservation.program || '';
        reservation.other = reservation.other || '';
      });
      // Datatable code
      // Setup - add a text input to each footer cell
      $('#reservationsList thead tr:first th:not(:first)').each(function (index) {
        var title = $(this).text();
        var pos = index + 1;
        $(this).html('<input class="form-control" id="col-search-'+pos+'" type="text" placeholder="Search '+title+'" />');
      });

      vm.createDatatable(vm.reservations);
    });


    // Open Link to reservation.view
    vm.openReservation = function(index) {
      vm.currentIndex = index;
      var current = vm.reservations[index];
      $state.go('reservations.view', { reservationId: current._id });
    };

    // Init datatable
    vm.createDatatable = function(data){
      vm.table = $('#reservationsList').DataTable({
        dom: 'Bfrtip',
        scrollX: true,
        scrollCollapse: true,
        autoWidth: false,
        paging: false,
        stateSave: true,
        buttons: [
          'copy', 'excel', 'pdf', 'colvis'
        ],
        data: data,
        'order': [[ 1, 'asc' ]],
        columns: [
          { data: 'nr' },
          { data: 'date' },
          { data: 'name',
            'fnCreatedCell': function (nTd, sData, oData, iRow, iCol) {
              $(nTd).html('<button class="btn-link" data-ng-click="vm.openReservation('+ iRow+')">'+sData+'</button>');
              // VIKTIG: för att ng-click ska kompileras och finnas.
              $compile(nTd)($scope);
            }
          },
          { data: 'program' },
          { data: 'year' },
          { data: 'email' },
          { data: 'phone' },
          { data: 'foodpref' },
          { data: 'other' },
          { data: 'enrolled' },
          { data: 'standby' },
          { data: 'pending' },
          { data: 'offer' },
        ]
      });

      // Apply the search
      vm.table.columns().every(function (index) {
        var that = this;
        $('input#col-search-'+index).on('keyup change', function () {
          if (that.search() !== this.value) {
            that.search(this.value).draw();
          }
        });
      });
    };



  }
}());
