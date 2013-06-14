var logger = require('./logger');
/*
var pif = require('./piface').PiFace();

pif.init();
// TODO: add pif.shutdown() somewhere
process.on('exit', function() {
    console.log("Shutting down SPI connection");
    pif.shutdown()
});

function pulse(num, time) {
    if (pif.write(1, num)) {
        setTimeout(function() { 
            if (!pif.write(0, num)) {
                console.log('Error clearing output '+num);
                return false;
            }
        }, (time*1000)/2); // 50% duty cycle
        return true;
    } else {
        console.log('Error setting output '+num);
        return false;
    }
}
*/
// node-spi currently not working so using gpio command from wiringPi
var exec = require('child_process').exec

function gpio_ctrl(ctrl, num, state) {
    var str = 'gpio -p '+ctrl+' '+num+' '+state;
    logger.debug('exec: '+str);
    out = exec(str, function(error, stdout, stderr) {
        //logger.info('stdout: ' + stdout);
        //logger.info('stderr: ' + stderr);
        if (error !== null) {
            logger.error('exec error: ' + error);
        }
    });
    return out;
}

//function setup() {
    for (i=0; i<8; i++) {
        gpio_ctrl('mode', (200+i).toString(), 'out');
    }
//}

function pulse(num, time, duty) {
    if (num > 7) {
        logger.error('Invalid relay number '+num);
        return false;
    } else {
        if(duty > 99 || duty < 1) {
            logger.error('Invalid duty cycle given: '+duty);
            return false;
        } else {
            gpio_ctrl('write', (200+num).toString(), '1');    
            setTimeout(function() {
                gpio_ctrl('write', (200+num).toString(), '0');
            }, time*(duty/100));
            return true;
        }
    }
}

var pageData = {
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

var timer;

function doCycle(socket) {
    logger.debug("Output " + pageData.out1 + " OUT for " + pageData.step1 + " milliseconds");
    pulse(pageData.out1, pageData.step1, 10);
    pageData.cylinderState = "OUT";
    socket.emit("state-changed", pageData); // Send message to sender
    socket.broadcast.emit("state-changed", pageData); // Send message to everyone BUT sender
    setTimeout(function() {
        logger.debug("Output " + pageData.out2 + " IN for " + pageData.step2 + " milliseconds");
        pulse(pageData.out2, pageData.step2, 10);
        pageData.cylinderState = "IN";
        socket.emit("state-changed", pageData);
        socket.broadcast.emit("state-changed", pageData);
        setTimeout(function() {
            logger.debug("Output " + pageData.out1 + " OUT for " + pageData.step3 + " milliseconds");
            pulse(pageData.out1, pageData.step3, 10);
            pageData.cylinderState = "OUT";
            socket.emit("state-changed", pageData);
            socket.broadcast.emit("state-changed", pageData);
            setTimeout(function() {
                logger.debug("Output " + pageData.out2 + " IN for " + pageData.step4 + " milliseconds");
                pulse(pageData.out2, pageData.step4, 10);
                pageData.cylinderState = "IN";
                socket.emit("state-changed", pageData);
                socket.broadcast.emit("state-changed", pageData);
                setTimeout(function() {}, pageData.step4);
            }, pageData.step3);
        }, pageData.step2);
    }, pageData.step1);
    logger.info('Cycle '+pageData.count+' of '+pageData.repetitions+' completed.');
}
    
function startController(socket) {
    pageData.controllerState = "Running";
    pageData.count = pageData.repetitions;
    var ms  = pageData.step1 + pageData.step2 + pageData.step3 + pageData.step4;
    logger.info("Starting cycle timer of " + ms + " ms");
    doCycle(socket);
    timer = setInterval(function() {
        pageData.count--;
        if (pageData.count > 0) {
            doCycle(socket);
        } else {
            logger.info("Test done. Stopping controller");
            pageData.controllerState = "Stopped";
            stopController();
            socket.emit("state-changed", pageData);
            socket.broadcast.emit("state-changed", pageData);
        }
    }, ms);
}
    
function stopController() {
    pageData.controllerState = "Stopped";
    clearInterval(timer);
}

process.on('exit', function() {
    logger.info("Shutting down. Stopping all started timers.");
    if(pageData.controllerState === 'Running') {
        stopController();
    }
});

function updateData(data) {
    pageData.step1 = parseInt(data.step1);
    pageData.step2 = parseInt(data.step2);
    pageData.step3 = parseInt(data.step3);
    pageData.step4 = parseInt(data.step4);
    pageData.out1 = parseInt(data.out1);
    pageData.out2 = parseInt(data.out2);
    pageData.repetitions = parseInt(data.repetitions);
    pageData.count = parseInt(data.count);
    pageData.cylinderState = data.cylinderState;
    pageData.controllerState = data.cylinderState;
}

// handle socket events
function handleSocket(socket) {
    socket.on("relay", function(data) {
        logger.info('Switching relay '+data.gpio);
        if (pulse(data.gpio, data.time, data.duty)) {
            socket.emit("ok");
        } else {
            socket.emit("error");
        }
    });
    socket.on("request-values", function(data) {
        logger.info('New client connected. Requesting values.');
        socket.emit("state-changed", pageData);
    });
    socket.on("start", function(data) {
        logger.info('New test requested. Setting values.');
        if(pageData.controllerState == "Running") {
            logger.warn('Not starting new test as one already running');
            socket.emit("error", {message: "Controller already running"});
        } else {
            updateData(data);
            startController(socket);
            socket.emit("ok");
        }
    });
    socket.on("stop", function(data) {
        logger.info('Stop test requested.');
        if(pageData.controllerState == "Running") {
            stopController();
            socket.emit("state-changed", pageData);
        } else {
            logger.warn('Not stopping as no test currently running');
            socket.emit("error", {message: "Controller not running"});    
        }
    });
}

exports.handleSocket = handleSocket;
