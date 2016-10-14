/* global $:false, Chart:false */
(function () {
  'use strict';

  angular
    .module('arkadevents')
    .controller('ArkadeventsFoodprefController', ArkadeventsFoodprefController);

  ArkadeventsFoodprefController.$inject = ['ArkadeventsService', 'ReservationsService', '$timeout'];

  function ArkadeventsFoodprefController(ArkadeventsService, ReservationsService, $timeout) {
    var vm = this;
    vm.eventData = [];

    ArkadeventsService.query(eventsFetched);
    function eventsFetched(data){
      vm.arkadevents = data;
      ReservationsService.query(reservationsFetched);
    }
    function reservationsFetched(data){
      function appendDataToEvent(r){
        
        // Append data from res to event.
        vm.arkadevents.forEach(append);
        function append(e){
          e.registeredfoodpref = e.registeredfoodpref || [];
          e.registeredother = e.registeredother || [];
          e.unregisteredfoodpref = e.unregisteredfoodpref || [];
          e.unregisteredother = e.unregisteredother || [];
          e.registered = e.registered || 0;
          e.unregistered = e.unregistered || 0;
          if(r.arkadevent === e._id && r.foodpref){
            if(r.enrolled || r.pending || r.standby){
              e.registeredfoodpref = e.registeredfoodpref.concat(r.foodpref.join());
              if(r.other){
                e.registeredother.push(r.other);
              }
              e.registered++;
            } else {
              e.unregisteredfoodpref = e.unregisteredfoodpref.concat(r.foodpref.join());
              if(r.other){
                e.unregisteredother.push(r.other);
              }
              e.unregistered++;
            }
          }    
        }
      }
      data.forEach(appendDataToEvent);

      // Summerize data in event
      vm.arkadevents.forEach(summerize);
      function summerize(e){
        e.registeredfoodpref = e.registeredfoodpref.reduce(groupTheList ,{});
        e.unregisteredfoodpref = e.unregisteredfoodpref.reduce(groupTheList ,{});
        function groupTheList(prev, foodpref){
          if(foodpref in prev) prev[foodpref] ++;
          else prev[foodpref] = 1;
          return prev;
        }
      }
      
      // Map to Chartjs dataset
      vm.arkadevents.forEach(toChartData);
      function toChartData(e){
        e.unregdata = [];
        e.unreglabels = [];
        for(var unkey in e.unregisteredfoodpref){
          e.unregdata.push(e.unregisteredfoodpref[unkey]);
          e.unreglabels.push(unkey);
        }
        e.regdata = [];
        e.reglabels = [];
        for(var key in e.registeredfoodpref){
          e.regdata.push(e.registeredfoodpref[key]);
          e.reglabels.push(key);
        }
      }
      $timeout(vm.showCharts);
    }
  
    vm.showCharts = function(){
      var pos = 0;
      vm.arkadevents.forEach(createEventCharts);
      function createEventCharts(e){
        vm.createChart('#registered-' + pos, e.regdata, e.reglabels);
        vm.createChart('#unregistered-' + pos, e.unregdata, e.unreglabels);
        pos++;
      }
    };

    // Current Data tracking
    vm.enrolled = 0;
    vm.pending = 0;
    vm.standby = 0;
    vm.unregistered = 0;
    vm.createChart = function(myElementId, chartData, chartLabels){
      // Chartjs code
      var ctx = $(myElementId);
      var data = {
        datasets: [{
          data: chartData,
          label: 'Reservation Data', // for legend
          borderWidth: 1
        }],
        labels: chartLabels
      };
      vm.chart = new Chart(ctx, {
        data: data,
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
  }
}());
