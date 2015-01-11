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

  var ref = firebase.child('users').child(authData.uid).child('metrics');
  ref.on('value', function(snap) {
    $scope.date = new Date();
    var metrics = snap.val();
    if (metrics.weight !== 'placeholder' && metrics.numerators !== 'placeholder') {
      $scope.numerators = metrics.numerators;
      $scope.submit = function() {
        var millis = $scope.date.getTime();
        console.log($scope.weight);
        if ($scope.weight) {
          metrics.weight.push({
            timeInMillis: millis,
            score: parseFloat($scope.weight)
          });
        }
        var $metrics = $('.metric-input');
        _.each($metrics, function(metric) {
          var $metric = $(metric);
          var score = $metric.val();
          var name = $metric.attr('id');
          console.log(name, score);
          if (score !== "") {
            var record = {
              timeInMillis: millis,
              score: parseFloat($metric.val())
            };
            _.each(metrics.numerators, function(numerator) {
              if (numerator.name === name) {
                numerator.records.push(record);
              }
            });
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
    } else {
      $location.path('/data');
    }
    $scope.$apply();
  });
});
