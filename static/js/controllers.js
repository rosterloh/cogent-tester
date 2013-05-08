
app.controller('AppCtrl', function ($scope) {
    
    $scope.state = "Stopped"; 
    $scope.timeout = 5;
    $scope.repetitions = 1000;    
    $scope.count = $scope.repetitions;
    
    $scope.startController = function () {
        $scope.state = "Running";
        $scope.count = $scope.repetitions;
        $scope.timer = setInterval(function() {
            $scope.count--;
            $scope.$apply();
        }, $scope.timeout*1000);
    };

    $scope.stopController = function () {
        $scope.state = "Stopped";
        clearInterval($scope.timer);
    };
});
