/**
 * This angular.module implements the socket.io lib as an angular.service.
 */
var socketioModule = angular.module('socketioModule', []);

socketioModule.factory('socket', function($rootScope, $location) {
    var socket = io.connect();

    socket.on("error", function(data) {
        console.log(data);
        $location.path('/login');
        //$rootScope.$apply(function() { $location.path("/route"); });
    });

    socket.on('disconnect', function() {
        $rootScope.$apply(function() { $location.path("/"); });
    });

    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                console.log(this, eventName);
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});


/*
.factory('socket', function ($rootScope) {
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});*/