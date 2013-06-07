
app.controller('OutputCtrl', function ($scope, socket) {
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
        socket.emit("relay", {gpio:num, time:$scope.relays[num].timeout, duty:$scope.relays[num].duty});
        $scope.timers[num] = setInterval(function() {
            if ($scope.count[num] > 0) {
                socket.emit("relay", {gpio:num, time:$scope.relays[num].timeout, duty:$scope.relays[num].duty});
                $scope.count[num]--;
                $scope.$apply();
            } else {
                $scope.stopController(num);
                $scope.$apply();
            }
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

app.controller('CylinderCtrl', function ($scope, socket) {
    $scope.cylinder = {timeout: 5, repetitions: 1000, state: 'IN' };
    $scope.state = 'Stopped';
    $scope.count = 0;
    
    $scope.startController = function () {
        $scope.state = "Running";
        $scope.count = $scope.cylinder.repetitions;
        var ms = $scope.cylinder.timeout*1000;
        $scope.timer = setInterval(function() {
            if ($scope.count > 0) {
                socket.emit("relay", {gpio:0, time:(ms/2000), duty:10});
                $scope.cylinder.state = "OUT";
                $scope.$apply();
                setTimeout(function() {
                    socket.emit("relay", {gpio:1, time:(ms/2000), duty:10});
                    $scope.cylinder.state = "IN";
                    $scope.$apply();
                }, (ms/2));
                $scope.count--;
            } else {
                $scope.stopController();
                $scope.$apply();
            }
        }, ms);
    };
    
    $scope.stopController = function () {
        $scope.state = "Stopped";
        clearInterval($scope.timer);
    };
});

app.controller('NavbarCtrl', function ($scope, $location) {
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) == path) {
            return true;
        } else {
            return false;
        }
    };
});