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

function relay(num, time) {
    if (num === 1) {
        return pulse(0, time);
    } else if (num === 2) {
        return pulse(1, time);
    } else {
        console.log('Invalid relay number '+num);
        return false;
    }
}

// handle socket events
function handleSocket(socket) {
    socket.on("relay", function(data) {
        console.log('Switching relay '+data.gpio);
        if (relay(data.gpio, data.time)) {
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
