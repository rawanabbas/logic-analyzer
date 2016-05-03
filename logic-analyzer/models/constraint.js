'use strict';
var fs = require('fs-extra');

var Util  = require('./utility');

module.exports = function (filename) {
    var _inputSlews = {};
    var _inputDelays = {};
    var _capacitanceLoads = {};
    var _outputDelays = {};
    var _clock;

    var _setClock = function (clk) {
        _clock = clk;
    };

    var _setInputSlews = function (slew) {
        for (var key in slew) {
            if (slew.hasOwnProperty(key)) {
                _inputSlews[Util.getPortName(key)] = slew[key];
            } //End of if
        } //End of for in
    }; //End of _setInputSlew

    var _setInputDelays = function (delays) {
        console.log('________________________________________________________');
        console.log('                    INPUT DELAYS                       ');
        console.log('_______________________KEYS_____________________________');
        for (var key in delays) {
            if (delays.hasOwnProperty(key)) {
                console.log(key);
                _inputDelays[Util.getPortName(key)] = delays[key];
            } //End of if
        } //End of for in
        console.log('___________________END KEYS_____________________________');
        console.log('_______________________VALUES___________________________');
        console.log(_inputDelays);
        console.log('____________________END VALUES__________________________');
        console.log('________________________________________________________');
        console.log('                   END INPUT DELAYS                     ');
        console.log('________________________________________________________');
    }; //End of _setInputDelays

    var _setCapacitanceLoad = function (capacitance) {
        for (var key in capacitance) {
            if (capacitance.hasOwnProperty(key)) {
                _capacitanceLoads[Util.getPortName(key)] = Math.max(capacitance[key].rise_capacitance, capacitance[key].fall_capacitance);
            } //End of if
        } //End of for in
    }; //End of _setCapacitanceLoad

    var _setOutputDelays = function (delays) {
        for (var key in delays) {
            if (delays.hasOwnProperty(key)) {
                _outputDelays[Util.getPortName(key)] = delays[key];
            } //End of if
        } //End of for in
    }; //End of _setOutputDelays

    this.parseConstraint = function (filename) {
        fs.readJson(filename, function (err, data) {
            if (err) {
                console.error(err);
            } else {
                console.log('======================================================');
                console.log('                    CONSTRAINTS                       ');
                console.log('======================================================');
                console.log(data);
                _setClock(data["clock"]);
                _setInputDelays(data["input_delays"]);
                _setInputSlews(data["input_slew"]);
                _setCapacitanceLoad(data["output_capacitance_load"]);
                _setOutputDelays(data["output_delays"]);
                console.log('======================================================');
                console.log('                    END CONSTRAINTS                   ');
                console.log('======================================================');
            } //End of else
        }); //End of readJson
    }; //End of parseConstraint

    if (filename) {
        this.parseConstraint(filename);
    } //End of filename

    this.getInputSlew = function (port) {
        if (port) {
            return _inputSlews[port];
        } else {
            return _inputSlews;
        }
    }; //End of getInputSlews

    this.getInputDelay = function (port) {
        // console.log("++++++++++++++ Input Delays ++++++++++++++");
        // console.log(_inputDelays);
        // console.log("+++++++++++ END Input Delays ++++++++++++++");
        if (port) {
            return _inputDelays[port];
        } else {
            return _inputDelays;
        } //End of else
    }; //End of getInputDelay

    this.getCapacitanceLoads = function (port) {
        if (port) {
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log(_capacitanceLoads[port]);
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-');
            return _capacitanceLoads[port];
        } else {
            return _capacitanceLoads;
        } //End of else
    }; //End of getCapacitanceLoads

    this.getOutputDelay = function (port) {
        if (port) {
            return _outputDelays[port];
        } else {
            return _outputDelays;
        } //End of else
    }; //End of getOutputDelay

}; //End of module.exports
