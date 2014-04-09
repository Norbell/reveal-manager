'use strict';
var app;
var sockets = "";
var loggedin = false;

app = angular.module("MyPresi",
        ['ngRoute',
        'ngSanitize',
        'socketioModule',
        'ui.bootstrap',
        'revealModule'
        ])
    .config(function($routeProvider) {
  $routeProvider.
    when('/', { 
        templateUrl: '/app/view/prestationsoverview.html',
        controller: "PresentationOverviewCtrl",
        title: "Präsentation Übersicht"}).
    when('/login', { 
        templateUrl: '/app/view/login.html',
        controller: "LoginCtrl",
        title: "Login",
        withoutLogin: true}).
    when('/speaker/:idPresentation', {
        templateUrl: '/app/view/presentation_SpeakerViewport.html',
        bodyClass: "presentation"}).
    when('/presentationedit/:idPresentation', { 
        templateUrl: '/app/view/presentationedit.html',
        controller: "PresentationEdit",
        title: "Präsentation Bearbeiten",
        bodyClass: "presentationedit_body"}).
    when('/ps/:idPresentation', {
          templateUrl: '/app/view/presentation_PresentationScreenViewport.html',
          bodyClass: "presentation"}).
    when('/a/:resolveToken', {
        templateUrl: '/app/view/presentation_AudienceViewport.html',
        controller: "RevealAudienceViewportCtrl",
        title: "Presentation",
        bodyClass: "presentation",
        withoutLogin: true}).
    otherwise({ redirectTo: '/'});
});

app.run(['$location', '$rootScope', '$http', function($location, $rootScope, $http) {
        // register listener to watch route changes
        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            console.log(next);
            if (!next.$$route.withoutLogin) {
                $http({method: 'GET', url: '/auth/loggedin'}).error(function(data, status, headers, config){
                   
                    if(status == 401){
                        $location.path('/login');
                        $rootScope.navButtons = "notloggedin";
                    }
                    return;
                }).success(function(){ 
                    loggedin=true;
                    $rootScope.navButtons = "loggedin";
                });
            } else {
                if(!loggedin)
                    $rootScope.navButtons = "notloggedin";
                else
                    $rootScope.navButtons = "loggedin";
            }
        });

        $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
            if (current.$$route) {
                $rootScope.title = current.$$route.title;
                $rootScope.bodyClass = current.$$route.bodyClass;
            }
        });
    }]);


app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    }
});

function LoginCtrl($rootScope, $scope, socket, $modal) {
    
}

function PresentationOverviewCtrl($rootScope, $scope, socket, $modal) {
    socket.on('presentation:overview', function (data) {
        $scope.presentations = data;
    });
    socket.emit('presentation:overview', {'get': true});
    $scope.newpresentation = { };

    $scope.removePresentation = function (item) {
        var index = $scope.presentations.indexOf(item);
        console.log(item);
        if (confirm("Wollen Sie wirklich die Presentation löschen?")) {
            socket.on('presentation:delete', function (data) {
                if (data.error == false) {
                    $scope.presentations.splice(index, 1);
                }
            });
            socket.emit('presentation:delete', {'get': true, 'id': item.id});
        }
    };

    //ng-click for add presentation button
    $scope.showPresentationAddDialog = function () {
        $scope.newpresentation = { };
        var modalInstance = $modal.open({
            templateUrl: 'DialogPresentationCreate.html',
            controller: DialogPresentationCreateInstanceCtrl,
            resolve: {
                newpresentation: function () {
                    return $scope.newpresentation;
                }
            }
        });
    };

    //change existing setting for a presentation
    $scope.openSetting = function (presentation) {
        $scope.newpresentation = { };

        //set data to form 
        if (presentation.attributs) {
            $scope.newpresentation = presentation.attributs;
        } else { //load default settings
            $scope.newpresentation = { name: "", transition: "default", transitionSpeed: "default", backgroundTransition: "default" };
        }

        $scope.newpresentation.name = presentation.name;
        $scope.newpresentation.id = presentation.id;

        var modalInstance = $modal.open({
            templateUrl: 'DialogPresentationCreate.html',
            controller: DialogPresentationCreateInstanceCtrl,
            resolve: {
                newpresentation: function () {
                    return $scope.newpresentation;
                }
            }
        });
    };

    //Dialog for starting a presentation
    $scope.dialogStartPresentation = function(presentation) {
        var presentationValues= presentation;

        var modalInstance = $modal.open({
            templateUrl: 'DialogStartPresentation.html',
            controller: startPresentationDialogCtrl,
            resolve: {
                itemValues: function () {
                    return presentationValues;
                }
            }
        });
    };
}


function DialogPresentationCreateInstanceCtrl($scope, $modalInstance, $location, newpresentation, socket) {
    $scope.newpresentation = newpresentation;
    
    if(newpresentation.id == undefined){
        $scope.newpresentation= { name:"", transition:"default", transitionSpeed: "default", backgroundTransition : "default" };
    }
    
    console.log(newpresentation);
    $scope.newPresentationOk = function() {
        newpresentation = $scope.newpresentation;

        if (newpresentation.id == undefined) {
            socket.on('presentation:create', function(data) {
                window.location.href = "/";
            });
            socket.emit('presentation:create', newpresentation);
        } else {
            console.log("Edit presentation");
            socket.on('presentation:settingSave', function(data) {
                window.location.href = "/";
            });
            socket.emit('presentation:settingSave', newpresentation);
        }
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}

function PresentationEdit($scope, $routeParams,$sce , socket) {
    $scope.savealert = false;
    $scope.savealerterror = false;

    function generateHTMLPresentation(data){
        var html = "";
        $.each(data, function(index, item){
            var attr = "";
            $.each(this.attributs, function(key, value){
                attr += "data-" + key + "='" + value + "' ";
            })

            html += "<section "+attr+">\n"+this.text+"\n</section>\n";
        });
        return html;
    }

    socket.on('presentation:slides', function(data) {
        console.log(data);
        var html = generateHTMLPresentation(data.sections);
        $scope.presentationedit = {};
        $scope.presentationedit.html = html;
        $scope.slides = $sce.trustAsHtml(html);
        if(data.presentationCSS != null) {
            $scope.presentationedit.css = data.presentationCSS.css;
            $scope.styledef = '<style type="text/css">'+data.presentationCSS.css+'</style>';
        }
                
        $scope.saveButton = function(){
            $scope.savealert = false;
            $scope.savealerterror = false;
            
            var object = [];
            var dataattr = [];
            $('.slides > section').each(function(){
                dataattr.push(this.dataset);
                object.push($(this).html());
            });
            

            socket.on('presentation:save', function(data) {
                if(!data.error) {
                    $scope.savealert = true;
                } else {
                    $scope.savealerterror = true;
                }
               console.log("save" + data.error) ;
            });
            socket.emit('presentation:save', {'idPresentation': $routeParams.idPresentation, 'html' : object, 'dataattr':dataattr, css : $scope.presentationedit.css});
        };


        $scope.$watch('presentationedit.css', function(newValue, oldValue) {
            $scope.styledef = newValue;
        });
        $scope.$watch('presentationedit.html', function(newValue, oldValue) {
            $scope.slides =  $sce.trustAsHtml(newValue);

            $scope.$watch(function() {
                Reveal.initialize({
                    // Display controls in the bottom right corner
                    controls: false,
                    progress: false,
                    slideNumber: false,
                    history: false,
                    keyboard: true,
                    overview: false,
                    center: true,
                    touch: true,
                    // Loop the presentation
                    loop: false,
                    // Change the presentation direction to be RTL
                    rtl: false,
                    // Turns fragments on and off globally
                    fragments: true,
                    // Flags if the presentation is running in an embedded mode,
                    // i.e. contained within a limited portion of the screen
                    embedded: true,
                    // Opens links in an iframe preview overlay
                    previewLinks: false,
                    // Transition style
                    transition: 'default', // default/cube/page/concave/zoom/linear/fade/none

                    // Transition speed
                    transitionSpeed: 'default', // default/fast/slow

                    // Transition style for full page slide backgrounds
                    backgroundTransition: 'default', // default/none/slide/concave/convex/zoom

                    // Number of slides away from the current that are visible
                    viewDistance: 3
                });
            });
        });
    });
    socket.emit('presentation:slides', {'idPresentation': $routeParams.idPresentation});
}

function startPresentationDialogCtrl($scope, $location, $window,$modalInstance, itemValues){
    $scope.praesentationID   = itemValues.id;
    $scope.presentationName = itemValues.name;
    $scope.presentationURL  = itemValues.shorturl;
    $scope.starPresenterView = true;
    console.log(itemValues);

    //Settings for the presentation screen


    $scope.startPresentation = function(startOnScreenCheckbox) {
        console.log('button was pressed');
        if (startOnScreenCheckbox) {
            console.log('checkbox ist true: '+ $scope.starPresenterView);
            $window.open('/#/ps/'+itemValues.id,itemValues.name);
            $location.path('/speaker/'+itemValues.id);
            $modalInstance.dismiss('cancel');
        } else {
            //Only Speaker-Mode will get started
            $location.path('/speaker/'+itemValues.id);
            $modalInstance.dismiss('cancel');
        }
    };
    //window.location.href = "/";
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}
