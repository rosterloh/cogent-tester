var app = angular.module('cogentApp', ['ui.bootstrap']);

//This configures the routes and associates each route with a view and a controller
app.config(function ($routeProvider) {
    $routeProvider
        .when('/outputs',
            {
                controller: 'OutputCtrl',
                templateUrl: '/app/partials/outputs.html'
            })
        //Define a route that has a route parameter in it (:customerID)
        /*.when('/customerorders/:customerID',
            {
                controller: 'CustomerOrdersController',
                templateUrl: '/app/partials/customerOrders.html'
            })*/
        .when('/cylinder',
            {
                controller: 'CylinderCtrl',
                templateUrl: '/app/partials/cylinder.html'
            })
        .otherwise({ redirectTo: '/cylinder' });
});

// Socket factory
app.factory('socket', function ($rootScope) {
    console.log("socket factory");
    var socket = io.connect();
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
            });
        }
    };
});
