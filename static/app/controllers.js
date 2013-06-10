
app.controller('OutputCtrl', function ($scope, socket) {
    $scope.state = 'Stopped';
    $scope.relays = []; 
    $scope.timers = [];
    $scope.count = [];
    for (i=0; i<8; i++) {
        $scope.relays[i] = { index: i, timeout: 5000, repetitions: 1000, duty: 50, state: 'Stopped' };
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
        }, $scope.relays[num].timeout);
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
    $scope.cylinder = {step1: 3000, step2: 20000, step3: 6000, step4: 1000, repetitions: 1000, state: 'IN'};
    $scope.state = 'Stopped';
    $scope.count = 0;
    $scope.outputs = [
        {name:"Output 0", value:0},
        {name:"Output 1", value:1},
        {name:"Output 2", value:2},
        {name:"Output 3", value:3},
        {name:"Output 4", value:4},
        {name:"Output 5", value:5},
        {name:"Output 6", value:6},
        {name:"Output 7", value:7}
    ];
    $scope.out1 = $scope.outputs[0];
    $scope.out2 = $scope.outputs[1];
    
    $scope.doCycle = function () {
        console.log($scope.out1.name + " OUT for " + $scope.cylinder.step1 + " milliseconds");
        socket.emit("relay", {gpio:$scope.out1.value, time:$scope.cylinder.step1, duty:10});
        $scope.cylinder.state = "OUT";
        //$scope.$apply();
        setTimeout(function() {
            console.log($scope.out2.name + " IN for " + $scope.cylinder.step2 + " milliseconds");
            socket.emit("relay", {gpio:$scope.out2.value, time:$scope.cylinder.step2, duty:10});
            $scope.cylinder.state = "IN";
            $scope.$apply();
            setTimeout(function() {
                console.log($scope.out1.name + " OUT for " + $scope.cylinder.step3 + " milliseconds");
                socket.emit("relay", {gpio:$scope.out1.value, time:$scope.cylinder.step3, duty:10});
                $scope.cylinder.state = "OUT";
                $scope.$apply();
                setTimeout(function() {
                    console.log($scope.out2.name + " IN for " + $scope.cylinder.step4 + " milliseconds");
                    socket.emit("relay", {gpio:$scope.out2.value, time:$scope.cylinder.step4, duty:10});
                    $scope.cylinder.state = "IN";
                    $scope.$apply();
                    setTimeout(function() {}, $scope.cylinder.step4);
                }, $scope.cylinder.step3);
            }, $scope.cylinder.step2);
        }, $scope.cylinder.step1);
    };
    
    $scope.startController = function () {
        $scope.state = "Running";
        $scope.count = $scope.cylinder.repetitions;
        var ms = parseInt($scope.cylinder.step1) + parseInt($scope.cylinder.step2) + parseInt($scope.cylinder.step3) + parseInt($scope.cylinder.step4);
        console.log("Starting cycle timer of " + ms + " ms");
        $scope.doCycle();
        $scope.timer = setInterval(function() {
            $scope.count--;
            if ($scope.count > 0) {
                $scope.doCycle();
            } else {
                console.log("Test done. Stopping controller");
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