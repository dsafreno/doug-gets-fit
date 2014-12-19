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
  $scope.fblogin = function() {
    firebase.authWithOAuthPopup("facebook", function(error, authData) {
      console.log(authData);
      if (error) {
        alert("error logging in");
      } else {
        authData['metrics'] = {
          'weight': 'placeholder',
          'numerators': 'placeholder'
        }
        var newUser = {};
        newUser[authData.uid] = authData;
        firebase.child('users').update(newUser);
        $scope.$apply(function() {
          $location.path("/");
        });
      }
    });
  }
});
