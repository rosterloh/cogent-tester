var fs = require('fs'),
    path = require('path'),
    winston = require('winston');

//check for the existence of the logs directory, if it doesn't
//exist, create it prior to starting the child process.
var exists = path.existsSync(__dirname + '/logs');
if (!exists) {
    fs.mkdirSync(__dirname + '/logs', 0755);
    winston.info('created logs folder');
}

var logger = new (winston.Logger)({
  transports: [
    //new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + '/logs/output.log', json: false, timestamp: true })
  ],
  exceptionHandlers: [
    //new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + '/logs/errors.log', json: false, timestamp: true })
  ],
  exitOnError: false
});

module.exports = logger;