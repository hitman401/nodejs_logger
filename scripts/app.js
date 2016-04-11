window.logVisualiser = angular.module('log-visualiser', ['ui.router', 'react']);
window.logVisualiser.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('logs');

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'partials/login.html'
    })
    .state('logs', {
      url: '/logs/:uid',
      templateUrl: 'partials/log_list.html'
    });
});
