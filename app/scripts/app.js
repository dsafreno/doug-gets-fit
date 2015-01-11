/* global app:true */
/* exported app */
'use strict';

/**
 * @ngdoc overview
 * @name dougGetsFitApp
 * @description
 * # dougGetsFitApp
 *
 * Main module of the application.
 */

var firebase = new Firebase("https://doug-gets-fit.firebaseio.com");
function isLoggedIn() {
  return firebase.getAuth();
}

var app = angular
  .module('dougGetsFitApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngQuickDate'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/record', {
        templateUrl: 'views/record.html',
        controller: 'RecordCtrl'
      })
      .when('/main', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/data', {
        templateUrl: 'views/data.html',
        controller: 'DataCtrl'
      })
      .when('/', {
        templateUrl: 'views/signin.html',
        controller: 'SigninCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

