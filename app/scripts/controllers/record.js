'use strict';

/**
 * @ngdoc function
 * @name dougGetsFitApp.controller:RecordCtrl
 * @description
 * # RecordCtrl
 * Controller of the dougGetsFitApp
 */
app.controller('RecordCtrl', function ($scope, $location) {
  var authData = firebase.getAuth();
  if (authData === null) {
    $location.path("/");
    return;
  }

  var ref = firebase.child('users').child(authData.uid);
  ref.on('value', function(snap) {
    $scope.date = new Date();
    var metrics = snap.val();
    $scope.numerators = [];
    _.each(metrics.numerators, function(numerator, name) {
      $scope.numerators.push(name);
    });
    $scope.submit = function() {
      var millis = $scope.date.getTime();
      if ($scope.weight) {
        metrics.weight[millis] = parseFloat($scope.weight);
      }
      var $metrics = $('.metric-input');
      _.each($metrics, function(metric) {
        var $metric = $(metric);
        var score = $metric.val();
        var name = $metric.attr('id');
        if (score !== "") {
          metrics.numerators[name].records[millis] = parseFloat($metric.val());
        }
      });
      var ref = firebase.child('users').child(authData.uid);
      ref.update({
        metrics: angular.fromJson(angular.toJson(metrics))
      }, function() {
        $location.path('/main');
        $scope.$apply();
      });
    }
    $scope.$apply();
  });
});
