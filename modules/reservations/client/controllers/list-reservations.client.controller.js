/* global Chart:false, $:false */
(function () {
  'use strict';

  angular
    .module('reservations')
    .controller('ReservationsListController', ReservationsListController);

  ReservationsListController.$inject = ['ReservationsService', '$stateParams', 'ArkadeventsService', '$state', '$filter', '$scope', '$compile', '$http'];

  function ReservationsListController(ReservationsService, $stateParams, ArkadeventsService, $state, $filter, $scope, $compile, $http) {
    var vm = this;

    var eventId = $stateParams.arkadeventId;
    vm.arkadevent = ArkadeventsService.get({ arkadeventId: eventId });

    // Current Data tracking
    vm.enrolled = 0;
    vm.pending = 0;
    vm.standby = 0;
    vm.unregistered = 0;
    vm.createChart = function(){
      // Chartjs code
      vm.ctx = $('#myChart');
      vm.data = {
        datasets: [{
          data: [ vm.enrolled, vm.pending, vm.standby, vm.unregistered ],
          backgroundColor: ['#FF6384', '#4BC0C0', '#FFCE56', '#36A2EB'],
          label: 'Reservation Data', // for legend
          borderWidth: 1
        }],
        labels: [
          'Enrolled', 'Pending', 'Standby', 'Unregistered'
        ]
      };
      vm.chart = new Chart(vm.ctx, {
        data: vm.data,
        type: 'polarArea',
        options: {
          elements: {
            arc: {
              borderColor: '#000000'
            }
          }
        }
      });
    };

    vm.reservations = ReservationsService.query(function (data){
      function isReservationForThisEvent(reservation){ return reservation.arkadevent === eventId; }
      vm.reservations = data.filter(isReservationForThisEvent);
      vm.reservations.$resolved = true;
      angular.forEach(vm.reservations, function(reservation, key) {
        reservation.nr = 1 + key;
        reservation.date = $filter('date')(reservation.created, 'yyyy-MM-dd HH:mm');
        reservation.pending = reservation.pending || false;
        reservation.offer = reservation.pending ? $filter('date')(reservation.offer, 'yyyy-MM-dd HH:mm') : '';
        reservation.enrolled = reservation.enrolled || false;
        reservation.standby = reservation.standby || false;
        reservation.unregistered = !reservation.enrolled && !reservation.standby;
        reservation.program = reservation.program || '';
        reservation.other = reservation.other || '';
        
        vm.enrolled += reservation.enrolled;
        vm.pending += reservation.pending;
        vm.standby += reservation.standby && !reservation.enrolled && !reservation.pending;
        vm.unregistered += (reservation.standby + reservation.pending + reservation.enrolled) === 0;
      });
      vm.createChart();
      // Datatable code
      // Setup - add a text input to each footer cell
      $('#reservationsList thead tr:first th:not(:first)').each(function (index) {
        var title = $(this).text();
        var pos = index + 1;
        $(this).html('<input class="form-control" id="col-search-'+pos+'" type="text" placeholder="Search '+title+'" />');
      });

      vm.createDatatable(vm.reservations);
    });

    vm.current = {};
    vm.currentIndex = -1;
    var modal = document.getElementById('myModal');
    var btn = document.getElementById('myBtn');
    var closeBtn = document.getElementsByClassName('close')[0];
    // Open Link to reservation.view
    vm.openReservation = function(index) {
      vm.currentIndex = index;
      $scope.current = vm.reservations[index];
      modal.style.display = 'block';
    };
    closeBtn.onclick = function() {
      modal.style.display = 'none';
      vm.currentIndex = -1;
    };
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
    // Show message in 10 sec
    vm.showMessage = function (message){
      $scope.message = message;
      setTimeout(function(){ 
        $scope.message = undefined; 
        $scope.$apply();
      }, 10000);
    };

    // Unregister reservation
    vm.setUnregistered = function (index){
      var imSure = window.confirm('Are you sure you want to deregister reservation from this event?');
      if(imSure){
        vm.reservations[index].unregistered = true;
        var reservation = vm.reservations[index];
        $http.post('/api/reservations/unregisterbyadmin', { arkadeventId: reservation.arkadevent, userId: reservation.user._id }).success(function (response) {
          vm.showMessage('Succesfully deregistered student. Message: ' + response.message);
        }).error(function (response) {
          vm.showMessage('Deregistration failed. Message: ' + response.message);
          vm.reservations[index].unregistered = false;
        });
      } 
    };
  
    // Offer Seat
    vm.offerSeat = function (index){
      var imSure = window.confirm('Are you sure you want to offer this reservation a seat?');
      if(imSure){
        vm.reservations[index].pending = true;
        var reservation = vm.reservations[index];
        $http.post('/api/reservations/offerseat', { reservationId: reservation._id }).success(function (response) {
          vm.showMessage('Succesfully offered student a seat and has been informed by mail. Message: ' + response.message);
        }).error(function (response) {
          vm.showMessage('Failed to offer the student a seat and send email. Message: ' + response.message);
          vm.reservations[index].pending = false;
        });
      }
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
          { data: 'enrolled', 
            'fnCreatedCell': function (nTd, sData, oData, iRow, iCol) {
              $(nTd).html('<input type="checkbox" ' + (sData ? 'checked' : '') + ' disabled />');
              $compile(nTd)($scope);
            }
          },
          { data: 'standby',
            'fnCreatedCell': function (nTd, sData, oData, iRow, iCol) {
              $(nTd).html('<input type="checkbox" ' + (sData ? 'checked' : '') + ' disabled />');
              $compile(nTd)($scope);
            }
          },
          { data: 'unregistered', 
            'fnCreatedCell': function (nTd, sData, oData, iRow, iCol) {
              $(nTd).html('<input type="checkbox" ' + (sData ? 'checked' : '') + ' data-ng-click="vm.setUnregistered('+ iRow+')" />');
              $compile(nTd)($scope);
            }
          },
          { data: 'pending',
            'fnCreatedCell': function (nTd, sData, oData, iRow, iCol) {
              $(nTd).html('<input type="checkbox" ' + (sData ? 'checked' : '') + ' data-ng-click="vm.offerSeat('+ iRow+')" />');
              $compile(nTd)($scope);
            }
          },
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
