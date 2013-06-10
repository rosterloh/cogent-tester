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
    console.log('exec: '+str);
    out = exec(str, function(error, stdout, stderr) {
        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
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
        console.log('Invalid relay number '+num);
        return false;
    } else {
        if(duty > 99 || duty < 1) {
            console.log('Invalid duty cycle given: '+duty);
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

// handle socket events
function handleSocket(socket) {
    socket.on("relay", function(data) {
        console.log('Switching relay '+data.gpio);
        if (pulse(data.gpio, data.time, data.duty)) {
            socket.emit("ok");
        } else {
            socket.emit("error");
        }
    });
    socket.on("led", function(data) {
        //changeLed(socket, data);
    });
}

exports.handleSocket = handleSocket;
