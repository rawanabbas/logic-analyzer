'use strict';
var Util = require('./utility');
module.exports = function (cell, inputs, outputs, size, tpd, tcd) {

    var _name;

    var _inputs = [];
    var _inputPorts = [];

    var _outputs = [];
    var _outputPorts = [];

    var _inout = [];
    var _inoutPorts = [];

    var _delayPoints = [];
    var _delayTargets = [];

    var _outputSlewPoints = [];
    var _outputSlewTargets = [];

    var _tpd = Number.MIN_VALUE;
    var _tcd = Number.MAX_VALUE;
    var _size = 1;
    var _availableSizes = [];

    var _outputSlew;
    var _inputSlew;
    var _capacitanceLoad;

    var _setOutputSlewPointsTargets = function (pins) {
        for (var i = 0; i < _outputPorts.length; i++) {
            for (var j = 0; j < _inputPorts.length; j++) {
                _outputSlewTargets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['rise_transition']['targets']);
                _outputSlewPoints.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['rise_transition']['points']);

                _outputSlewTargets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['fall_transition']['targets']);
                _outputSlewPoints.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['fall_transition']['points']);
            } //End of for j
        } //End of for i
    }; //End of _setOutputSlewPointsTargets

    var _setDelayPointsTargets = function (pins) {
        for (var i = 0; i < _outputPorts.length; i++) {
            for (var j = 0; j < _inputPorts.length; j++) {
                _delayTargets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_rise']['targets']);
                _delayPoints.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_rise']['points']);

                _delayTargets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_fall']['targets']);
                _delayPoints.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_fall']['points']);
            } //End of for j
        } //End of for i
    }; //End of _setDelayPointsTargets

    var _setSize = function (size) {
        _size = size;
    }; //End of _setSize

    var _setAvailableSizes = function (sizes) {
        _availableSizes = Util.clone(sizes);
    };

    var _setInputOutputPorts = function (pins) {
        var keys = Object.keys(pins);
        var direction;
        var port;
        for (var i = 0; i < keys.length; i++) {
            port = pins[keys[i]];
            direction = port["direction"];
            if (direction == "input") {
                _inputs.push(port);
                _inputPorts.push(keys[i]);
            } else if (direction == "output") {
                _outputs.push(port);
                _outputPorts.push(keys[i]);
            } else {
                _inout.push(port);
                _inoutPorts.push(keys[i]);
            } //End of else
        } //End of for
    }; //End of _setInputOutputPorts

    if (cell != null) {
        var pins = cell["pins"];
        _setInputOutputPorts(pins);
        _setAvailableSizes(cell["available_sizes"]);
        _setSize(cell["size"]);
        _setDelayPointsTargets(pins);
        _setOutputSlewPointsTargets(pins);
    } else {
        // TODO: One by One assignment
    }

    this.setName = function (name) {
        _name = name;
    }; //End of setName

    this.getName = function () {
        return _name;
    }; //End of getName

    this.getDelayPoints = function () {
        return _delayPoints;
    }; //End of getDelayPoints

    this.getDelayTargets = function () {
        return _delayTargets;
    }; //End of getDelayTargets

    this.getOutputSlewPoints = function () {
        return _outputSlewPoints;
    }; //End of getOutputSlewPoints

    this.getOutputSlewTargets = function () {
        return _outputSlewTargets;
    }; //End of getDelayTargets

    this.getInputs = function () {
        return _inputs;
    }; //End of this.getInputs

    this.getInputPorts = function () {
        return _inputPorts;
    }; //End of this.getInputPorts

    this.getOutputPorts = function () {
        return _outputPorts;
    }; //End of getOutputPorts

    this.getOutputs = function () {
        return _outputs;
    }; //End of this.getOutputs

    this.getPropagationDelay = function () {
        return _tpd;
    }; //End of this.getPropagationDelay

    this.getContaminationDelay = function () {
        return _tcd;
    }; //End of this.getContaminationDelay


    this.getOutputSlew = function () {
        return _outputSlew;
    }; //End of getOutputSlew

    this.setPropagationDelay = function (pd) {
        _tpd = pd;
    }; //End of this.setPropagationDelay

    this.setContaminationDelay = function (cd) {
        _tcd = cd;
    }; //End of setContaminationDelay

    this.setOutputSlew = function (slew) {
        _outputSlew = Util.clone(slew);
    }; //End of setOutputSlew

    this.getAvailableSizes = function () {
        return _availableSizes;
    }; //End of getAvailableSizes

    this.setCapacitanceLoad = function (capacitanceLoad) {
        _capacitanceLoad = Util.clone(capacitanceLoad);
    }; //End of setCapacitanceLoad

    this.getCapacitanceLoad = function () {
        return _capacitanceLoad;
    }; //End of getCapacitanceLoad

    this.setInputSlew = function (inputSlew) {
        _inputSlew = Util.clone(inputSlew);
    }; //End of inputSlew

    this.getInputSlew = function () {
        return _inputSlew;
    };

    this.getDelay = function () {
        return {
            delay: {
                tpd: this.getPropagationDelay(),
                tcd: this.getContaminationDelay()
            },
            slew: this.getOutputSlew()
        }; //End of return
    }; //End of getDelay

} //End of module.exports
