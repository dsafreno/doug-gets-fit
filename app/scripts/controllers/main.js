'use strict';

/**
 * @ngdoc function
 * @name dougGetsFitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dougGetsFitApp
 */
app.controller('MainCtrl', function ($scope, $location) {
  var authData = firebase.getAuth();
  if (authData === null) {
    $location.path("/");
  }
  $scope.profileUrl = authData.facebook.cachedUserProfile.picture.data.url;
  $scope.displayName = authData.facebook.cachedUserProfile.first_name.toUpperCase();
  var fitnessScoreName = authData.facebook.cachedUserProfile.first_name + " Fitness Score";
  var ref = firebase.child('users').child(authData.uid).child('metrics');
  ref.on('value', function(snap) {
    var metrics = snap.val();
    if (metrics.weight !== 'placeholder' && metrics.numerators !== 'placeholder') {
      GraphUtil.displayMetrics(metrics, fitnessScoreName);
    } else {
      $scope.$apply();
    }
  });
});

app.controller('DataPromptCtrl', function ($scope) {
  $scope.emptyText = function() {
  };
});




///// TODO REMOVE BELOW THIS POINT //////

//generates dummy data
var metrics = {
  weight: [],
  numerators: [
  {
    name: 'Squats',
    records: [],
    c: 2,
    k: 45,
    factor: 3
  }, {
    name: 'Bench press',
    records: [],
    c: 2,
    k: 45,
    factor: 2
  }
  ]
};


// Generate sample data
var time = 1384066400000;
var spacing = 3*24*60*60*1000;
var squat = 30;
var bench = 30;
var weight = 160;
var expectedChange = 0.2;
var dev = 0.75;

for (var i = 0; i < 100; i++) {
  metrics.weight.push({
    timeInMillis: time,
    score: weight
  });
  weight += Math.random() * 2 - 1;
  metrics.numerators[0].records.push({
    timeInMillis: time,
    score: squat
  });
  squat += (dev * 2) * Math.random() - dev + expectedChange;
  if (i % 2 == 0) {
    metrics.numerators[1].records.push({
      timeInMillis: time,
      score: bench
    });
    bench += (dev * 2) * Math.random() - dev + expectedChange;
  }
  time += spacing;
}

