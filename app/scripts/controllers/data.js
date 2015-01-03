'use strict';

/**
 * @ngdoc function
 * @name dougGetsFitApp.controller:DataCtrl
 * @description
 * # DataCtrl
 * Controller of the dougGetsFitApp
 */
app.controller('DataCtrl', function ($scope, $location) {
  $scope.json = "";
  var enabled = true;
  $scope.submit = function() {
    if (!enabled) {
      return;
    }
    enabled = false;
    var metrics = "";
    try {
      metrics = JSON.parse($scope.json);
    } catch (e) {
      alert("Unable to parse your json. Ensure its properly formatted and meets the spec.");
    }
    var authData = firebase.getAuth();
    var ref = firebase.child('users').child(authData.uid);
    ref.update({
      metrics: metrics
    }, function() {
      $location.path('/main');
      $scope.$apply();
    });
  };
});
