'use strict';

/**
 * @ngdoc function
 * @name dougGetsFitApp.controller:SigninCtrl
 * @description
 * # SigninCtrl
 * Controller of the dougGetsFitApp
 */
app.controller('SigninCtrl', function ($scope, $location) {
  var authData = firebase.getAuth();
  if (authData !== null) {
    $location.path("/main");
    return;
  }
  $scope.fblogin = function() {
    firebase.authWithOAuthPopup("facebook", function(error, authData) {
      if (error) {
        console.log(error);
        alert("error logging in");
      } else {
        $location.path("/main");
        $scope.$apply();
      }
    });
  }
});
