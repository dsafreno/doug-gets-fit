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
        var ref = firebase.child('users').child(authData.uid);
        ref.once('value', function(snap) {
          if (snap.val() === null) {
            authData['metrics'] = {
              'weight': 'placeholder',
              'numerators': 'placeholder'
            }
            var newUser = {};
            newUser[authData.uid] = authData;
            firebase.child('users').update(newUser);
          }
          $location.path("/main");
          $scope.$apply();
        });
      }
    });
  }
});
