var app = angular.module('cogentApp', ['ui.bootstrap']);

//This configures the routes and associates each route with a view and a controller
/*app.config(function ($routeProvider) {
    $routeProvider
        .when('/customers',
            {
                controller: 'CustomersController',
                templateUrl: '/app/partials/customers.html'
            })
        //Define a route that has a route parameter in it (:customerID)
        .when('/customerorders/:customerID',
            {
                controller: 'CustomerOrdersController',
                templateUrl: '/app/partials/customerOrders.html'
            })
        //Define a route that has a route parameter in it (:customerID)
        .when('/orders',
            {
                controller: 'OrdersController',
                templateUrl: '/app/partials/orders.html'
            })
        .otherwise({ redirectTo: '/customers' });
});
*/



