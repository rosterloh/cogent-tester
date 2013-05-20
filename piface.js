/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var spi = require('spi');

// SPI ops
var WRITE_CMD = 0x40;
var READ_CMD  = 0x41;

// Configuration ports for Pi-Face
var IODIRA = 0x00;
var IODIRB = 0x01;
var IOCON  = 0x0A;// config
var GPIOA  = 0x12;
var GPIOB  = 0x13;
var GPPUA  = 0x0C; // pullups for A
var GPPUB  = 0x0D;// pullups for B

var PIN_TYPE = {
    INPUT: GPIOB,
    OUTPUT: GPIOA,
    INPUT_PULLUPS: GPPUB
};

var PIN_TO_BITMASK = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];

var PiFace = exports.PiFace = function() {
    this.spi =  new spi.Spi('/dev/spidev0.0', {
                                'mode': spi.MODE['MODE_0']
                            });
};

/**
 * Initializes the board.
 *
 *
 *
 */
PiFace.prototype.init = function() {
    this.spi.open();

    this.__write(IOCON,  8); // Enable hardware addressing
    this.__write(GPIOA,  0x00); // Set port A on
    this.__write(IODIRA, 0);  // Set port A as outputs
    this.__write(IODIRB, 0xFF);  // Set port B as inputs
    this.__write(PIN_TYPE.INPUT_PULLUPS,  0xFF);// set port B pullups on
    this.__write(PIN_TYPE.OUTPUT, 0);// Set outputs to 0

};

PiFace.prototype.shutdown = function() {
    this.spi.close();
};

var readResult = function(pinNumber, current) {
    if ((pinNumber !== undefined) && (pinNumber >= 0) && (pinNumber < 8)) {
        if (current & PIN_TO_BITMASK[pinNumber]) {
            return 1;
        }  else {
            return 0;
        }
    } else {
        return current;
    }
};

/**
 * Reads the value of input pins.
 *
 * @param {number=} pinNumber A number from 0 to 7 that identifies the input
 *  pin to be read. If `undefined` all pins are returned (a byte).
 *
 * @return {number} 0 or 1 depending on whether input is active. If pinNumber
 * was undefined return a number from 0 till 255 with one bit on per active
 * pin.
 *
 */
PiFace.prototype.read = function(pinNumber) {
    var current = this.__read(PIN_TYPE.INPUT);
    // inputs are active low, need to isolate Pi Face implementation details
    current = current ^ 0xFF; 
    return readResult(pinNumber, current);
};


/**
 * Reads the value of output pins.
 *
 * @param {number=} pinNumber A number from 0 to 7 that identifies the output
 *  pin to be read. If `undefined` all pins are returned (a byte).
 *
 * @return {number} 0 or 1 depending on whether output is active. If pinNumber
 * was undefined return a number from 0 till 255 with one bit on per active
 * pin.
 *
 */
PiFace.prototype.readOutput = function(pinNumber) {
    var current = this.__read(PIN_TYPE.OUTPUT);
    return readResult(pinNumber, current);
};

/**
 * Reads the state of the pullups associated with input pins.
 *
 * @param {number=} pinNumber A number from 0 to 7 that identifies the output
 *  pin to be read. If `undefined` all pins are returned (a byte).
 *
 * @return {number} 0 or 1 depending on whether output is active. If pinNumber
 * was undefined return a number from 0 till 255 with one bit on per active
 * pin.
 *
 */
PiFace.prototype.readPullups = function(pinNumber) {
    var current = this.__read(PIN_TYPE.INPUT_PULLUPS);
    return readResult(pinNumber, current);
};

/**
 * Sets output pin values.
 *
 * @param {number} newValue New output value: 0 or 1, or a number from 0 till
 *  255 if pinNumber undefined.
 * @param {number=} pinNumber A number from 0 to 7 that identifies the output
 *  pin to be written. If `undefined` all pins are written and newValue is
 *  interpreted as a byte.
 *
 * @return {boolean} True if write was OK, false if error.
 *
 *
 */
PiFace.prototype.write = function(newValue, pinNumber) {
    if (pinNumber !== undefined) {
            if ((pinNumber >= 0) && (pinNumber < 8)) {
                var current = this.readOutput();
                newValue = (newValue ? current | PIN_TO_BITMASK[pinNumber]
                            : current & (~PIN_TO_BITMASK[pinNumber]));
            } else {
                return false;
            }
    }
    this.__write(PIN_TYPE.OUTPUT, newValue);
    return true;
};

/**
 * Sets pullups values for input pins.
 *
 * @param {number} newValue New output value: 0 or 1, or a number from 0 till
 *  255 if pinNumber undefined.
 * @param {number=} pinNumber A number from 0 to 7 that identifies the output
 *  pin to be written. If `undefined` all pins are written and newValue is
 *  interpreted as a byte.
 *
 * @return {boolean} True if write was OK, false if error.
 *
 *
 */
PiFace.prototype.writePullups = function(newValue, pinNumber) {
    if (pinNumber !== undefined) {
            if ((pinNumber >= 0) && (pinNumber < 8)) {
                var current = this.readPullups();
                newValue = (newValue ? current | PIN_TO_BITMASK[pinNumber]
                            : current & (~PIN_TO_BITMASK[pinNumber]));
            } else {
                return false;
            }
    }
    this.__write(PIN_TYPE.INPUT_PULLUPS, newValue);
    return true;
};

/**
 * Write a byte with all the new pin values.
 *
 */
PiFace.prototype.__write = function(pinType, newValue) {
    var sendBuf = new Buffer([WRITE_CMD, pinType, newValue]);
    var recvBuf = new Buffer([0x00, 0x00, 0x00]);
    this.__transfer(sendBuf, recvBuf);
};

/**
 * Reads a byte with all the pin values.
 *
 *
 */
PiFace.prototype.__read = function(pinType) {
    var sendBuf = new Buffer([READ_CMD, pinType, 0xff]);
    var recvBuf = new Buffer([0x00, 0x00, 0x00]);
    this.__transfer(sendBuf, recvBuf);
    // [command, port, **data**]
    return recvBuf[2];
};

/**
 * Performs an SPI transfer.
 *
 * type tBuffer is a Buffer with three bytes: command, port and data.
 * @param {tBuffer} sendBuf Transmission buffer.
 * @param {tBuffer} sendBuf Receiver buffer.
 *
 */
PiFace.prototype.__transfer = function(sendBuf, recvBuf) {
    // blocking
    this.spi.transfer(sendBuf, recvBuf);
};

