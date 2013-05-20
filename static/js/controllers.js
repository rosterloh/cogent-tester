
app.controller('AppCtrl', function ($scope, socket) {
    $scope.state = 'Stopped';
    $scope.relays = []; 
    $scope.timers = [];
    $scope.count = [];
    for (i=0; i<8; i++) {
        $scope.relays[i] = { index: i, timeout: 5, repetitions: 1000, duty: 50, state: 'Stopped' };
        $scope.count[i] = 1000;
    }    
    
    $scope.startController = function (num) {
        $scope.relays[num].state = "Running";
        $scope.state = "Running";
        $scope.count[num] = $scope.relays[num].repetitions;
        $scope.timers[num] = setInterval(function() {
            socket.emit("relay", {gpio:num, time:$scope.relays[num].timeout, duty:$scope.relays[num].duty});
            $scope.count[num]--;
            $scope.$apply();
        }, $scope.relays[num].timeout*1000);
    };

    $scope.stopController = function (num) {
        $scope.relays[num].state = "Stopped";
        clearInterval($scope.timers[num]);
        if($scope.relays.indexOf('Running') > -1)
            $scope.state = 'Running';
        else
            $scope.state = 'Stopped';
    };
});
