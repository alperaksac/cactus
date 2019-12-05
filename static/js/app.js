'use strict';

var cancerApp = angular.module('cancerApp', [
    'ngMaterial',
    'ngAnimate',
    'ngAria',
    'ngMessages',
    'ui.router',
    'lfNgMdFileInput',
    'md.data.table',
    'angular-intro'
]);

cancerApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $qProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider.state('dashboard', {
        url: '/',
        views: {
            'base@': { templateUrl: '../static/partials/dashboard.html' },
            'child_1@dashboard': { templateUrl: '../static/partials/home.html' },
            'child_2@dashboard': { templateUrl: '../static/partials/annotate.html' }
        },
        restricted: true
    }).state('dashboard.annotation', {
        url: '^/annotation',
        views: {
            'child_2@dashboard': { templateUrl: '../static/partials/annotate.html' }
        },
        restricted: true
    }).state('dashboard.grading', {
        url: '^/grading',
        views: {
            'child_2@dashboard': { templateUrl: '../static/partials/grading.html' }
        },
        restricted: true
    }).state('dashboard.bin', {
        url: '^/bin',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/bin.html' }
        },
        restricted: true
    }).state('dashboard.datasets', {
        url: '^/datasets',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/datasets.html' }
        },
        restricted: true
    }).state('dashboard.models', {
        url: '^/models',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/models.html' }
        },
        restricted: true
    }).state('dashboard.authors', {
        url: '^/authors',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/authors.html' }
        },
        restricted: true
    }).state('dashboard.annotations', {
        url: '^/annotations',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/annotations.html' }
        },
        restricted: true
    }).state('dashboard.results', {
        url: '^/scoringResults',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/scoringResults.html' }
        },
        restricted: true
    }).state('dashboard.compare', {
        url: '^/compareScores',
        views: {
            'child_1@dashboard': { templateUrl: '../static/partials/compareScores.html' }
        },
        restricted: true
    }).state('login', {
        url: '/login',
        views: {
            'base@': { templateUrl: '../static/partials/login.html' }
        },
        restricted: false
    }).state('logout', {
        url: '/logout',
        controller: 'LogoutController',
        restricted: true
    }).state('signup', {
        url: '/signup',
        views: {
            'base@': { templateUrl: '../static/partials/signup.html' }
        },
        restricted: false
    }).state('forgot', {
        url: '/forgot',
        views: {
            'base@': { templateUrl: '../static/partials/forgot.html' }
        },
        restricted: false
    }).state('editor', {
        url: '/editor',
        views: {
            'base@': { templateUrl: '../static/partials/editor.html' }
        },
        restricted: true
    }).state('scoring', {
        url: '/scoring',
        views: {
            'base@': { templateUrl: '../static/partials/scoring.html' }
        },
        restricted: true
    }).state('network', {
        url: '/network',
        views: {
            'base@': { templateUrl: '../static/partials/network.html' }
        },
        restricted: true
    });

    // use the HTML5 History API
    $locationProvider.html5Mode(true);

    // disable unhandled messages
    $qProvider.errorOnUnhandledRejections(false);
});

cancerApp.run(function ($transitions, $state, $http, $trace, $rootScope) {
    $transitions.onStart({}, function (trans) {
        $rootScope.previousState = trans.from();
        $rootScope.currentState = trans.to();
        $http.get('/api/status')
            .then(function successCallback(response) {                
                if (trans.to().restricted && !response.data['status']) {
                    trans.abort();
                    $state.go('login');
                }
            });
    });
});