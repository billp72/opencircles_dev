// MyChat App - Ionic & Firebase Demo

var firebaseUrl = "https://incandescent-torch-5679.firebaseio.com";

function onDeviceReady() {
    angular.bootstrap(document, ["mychat"]);
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
function init(){
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1 
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }
    if(window.isphone){
        document.addEventListener("deviceready", onDeviceReady, false);
    }else{
        onDeviceReady();
    }
}

// 'mychat.services' is found in services.js
// 'mychat.controllers' is found in controllers.js
angular.module('mychat', ['ionic', 'firebase', 'angularMoment', 'mychat.controllers', 'mychat.services', 'mychat.directives'])

.run(function ($ionicPlatform, $rootScope, $location, $state, Auth, $ionicLoading, $ionicModal, $window) {

    $ionicPlatform.ready(function () {
        $rootScope.advisor   =  !!JSON.parse($window.localStorage.getItem('advisor')) ?
                JSON.parse($window.localStorage.getItem('advisor')) : false;
        $rootScope.prospect  =  !!JSON.parse($window.localStorage.getItem('prospect')) ?
                JSON.parse($window.localStorage.getItem('prospect')) : false;
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // To Resolve Bug
        ionic.Platform.fullScreen();

        $rootScope.firebaseUrl = firebaseUrl;
        $rootScope.displayName = null;

        Auth.$onAuth(function (authData) {
            if (authData) {
                console.log("Logged in as:", authData.uid);
            } else {
                console.log("Logged out");
                $ionicLoading.hide();
                $location.path('/login');
            }
        });

      
        /*$rootScope.profile = function(template){

                $ionicModal.fromTemplateUrl('templates/'+template+'.html', {
                scope: $rootScope
            }).then(function (modal) {
                $rootScope.modal = modal;
                $rootScope.modal.show();
            });
        }*/
        
        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === "AUTH_REQUIRED") {
                $location.path("/login");
            }
        });
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    console.log("setting config");

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // State to represent Login View
    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl',
        resolve: {
            // controller will not be loaded until $waitForAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $waitForAuth returns a promise so the resolve waits for it to complete
                    return Auth.$waitForAuth();
        }]
        }
    })
    .state('menu', {
        url: "/menu",
        abstract: true,
        templateUrl: "templates/menu.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
      }]
        }
    })
    // setup an abstract state for the tabs directive
    .state('menu.tab', {
        url: "/tab",
        abstract: true,
        views: {
            'tabs': {
                templateUrl: "templates/tabs.html",
                controller: 'TabCtrl'
            }
        }
    })
    // Each tab has its own nav history stack:
    //menu.tab.newest and student show current questions for both HS and college
    .state('menu.tab.newest', {
        url: '/rooms',
        views: {
            'tab-rooms': {
                templateUrl: 'templates/tab-rooms.html',
                controller: 'RoomsCtrl'
            }
        }
    })
    .state('menu.tab.ask', {
        url: '/ask',
        views: {
            'tab-ask': {
                templateUrl: 'templates/askQuestion.html',
                controller: 'AskCtrl'
            }
        }
    })
    .state('menu.tab.student', {
        url: '/studentrooms/:schoolid',
        views: {
            'tab-student': {
                templateUrl: 'templates/tab-rooms-student.html',
                controller: 'StudentCtrl'
            }
        }
    })
     .state('menu.tab.studentc', {
        url: '/conversations',
        views: {
            'tab-converse': {
                templateUrl: 'templates/tab-student-convers.html',
                controller: 'StudentConversCtrl'
            }
        }
    })
    .state('menu.tab.settings', {
        url: '/settings',
        views: {
            'tab-settings': {
                templateUrl: 'templates/tab-settings.html',
                controller: 'SettingsCtrl'
            }
        }
    })
     .state('menu.tab.chat', {
        url: '/chat/:advisorID/:schoolid/:questionID/:prospectID/:indicatorToggle/:question',
        views: {
            'tab-chat':{
                templateUrl: 'templates/tab-chat.html',
                controller: 'ChatCtrl'  
            }   
        }
    })
     .state('menu.tab.answer', {
        url: '/answer/:advisorID/:schoolid/:questionID/:prospectID/:indicatorToggle/:question',
        views: {
            'tab-answer':{
                templateUrl: 'templates/tab-answer.html',
                controller: 'AnswerCtrl'  
            }   
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});