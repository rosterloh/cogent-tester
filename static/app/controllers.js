
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

    $scope.cylinder = {
        step1: 6000, 
        step2: 20000, 
        step3: 3000, 
        step4: 1000, 
        out1: 0,
        out2: 1,
        repetitions: 1000,
        count: 0,
        cylinderState: 'IN',
        controllerState: 'Stopped'
    };
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
    
    // handle incoming change events
    socket.on('connect', function() {
        console.log('Server connected.');
        $scope.server = "Connected";
        // Get current data
        socket.emit("request-values");
    });
    
    socket.on('disconnect', function () {
        console.log('Server disconnected.');
        $scope.server = "Disconnected";
    });
    
    // Handle status updates
    socket.on("state-changed", function(data) {
        console.log('New data recevied: '+data);
        $scope.cylinder = data;
        $scope.out1 = $scope.outputs[data.out1];
        $scope.out2 = $scope.outputs[data.out2];
    });
    
    socket.on("ok", function(data) {
        console.log('Got OK '+data);
    });
    
    socket.on("error", function(data) {
        console.log('Error received '+data);
    });

    $scope.startController = function () {
        $scope.cylinder.out1 = $scope.out1.value;
        $scope.cylinder.out2 = $scope.out2.value;
        // Start the test sending updated data
        socket.emit('start', $scope.cylinder);
    };
    
    $scope.stopController = function () {
        socket.emit('stop');
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