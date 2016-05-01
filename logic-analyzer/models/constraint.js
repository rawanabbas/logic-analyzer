'use strict';
var fs = require('fs-extra');

var Util  = require('./utility');

var INPUT = "input";
var OUTPUT = "output";

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
                _inputSlews[key.slice(INPUT.length)] = slew[key];
            } //End of if
        } //End of for in
    }; //End of _setInputSlew

    var _setInputDelays = function (delays) {
        for (var key in delays) {
            if (delays.hasOwnProperty(key)) {
                _inputDelay[key.slice(INPUT.length)] = delays[key];
            } //End of if
        } //End of for in
    }; //End of _setInputDelays

    var _setCapacitanceLoad = function (capacitance) {
        for (var key in capacitance) {
            if (capacitance.hasOwnProperty(key)) {
                _capacitanceLoads[key.slice(OUTPUT.length)] = capacitance[key];
            } //End of if
        } //End of for in
    }; //End of _setCapacitanceLoad

    var _setOutputDelays = function (delays) {
        for (var key in delays) {
            if (delays.hasOwnProperty(key)) {
                _outputDelays[key.slice(OUTPUT.length)] = delays[key];
            } //End of if
        } //End of for in
    }; //End of _setOutputDelays

    fs.readJson(filename, function (err, data) {
        if (err) {
            console.error(err);
            throw Error("An error has occured while parsing the constraints file.");
        } else {
            _setClock(data["clock"]);
            _setInputSlews(data["input_slew"]);
            _setInputDelays(data["input_delays"]);
            _setCapacitanceLoad(data["output_capacitance_load"]);
            _setOutputDelays(data["output_delays"]);
        } //End of else
    }); //End of readJson

    this.getInputSlew = function (port) {
        if (port) {
            return _inputSlews[port];
        } else {
            return _inputSlews;
        }
    }; //End of getInputSlews

    this.getInputDelay = function (port) {
        if (port) {
            return _inputDelays[port];
        } else {
            return _inputDelays;
        } //End of else
    }; //End of getInputDelay

    this.getCapacitanceLoads = function (port) {
        if (port) {
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
