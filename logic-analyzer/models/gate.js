'use strict';
var Util = require('./utility');
module.exports.Gate = function (cell, inputs, outputs, size, tpd, tcd) {

    var _inputs = [];
    var _inputPorts = [];

    var _outputs = [];
    var _outputPorts = [];

    var _inout = [];
    var _inoutPorts = [];

    var _points = [];
    var _targets = [];


    var _tpd = Number.MIN_VALUE;
    var _tcd = Number.MAX_VALUE;
    var _size = 1;

    var _availableSizes = [];

    if (cell != null) {

        var pins = cell["pins"];
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

        _availableSizes = cell["available_sizes"];
        _size = cell["size"];

        for (var i = 0; i < _outputPorts.length; i++) {
            for (var j = 0; j < _inputPorts.length; j++) {
                _targets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_rise']['targets']);
                _points.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_rise']['points']);

                _targets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['rise_transition']['targets']);
                _points.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['rise_transition']['points']);

                _targets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_fall']['targets']);
                _points.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['cell_fall']['points']);

                _targets.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['fall_transition']['targets']);
                _points.push(pins[_outputPorts[i]]['timing'][_inputPorts[j]]['fall_transition']['points']);
            } //End of for j
        } //End of for i

    } else {
        if (inputs != null) {
            _inputs = inputs;
        }
        if (outputs != null) {
            _outputs = outputs;
        }
        if (tpd != null) {
            _tpd = tpd;
        }
        if (tcd != null) {
            _tcd = tcd;
        }
        if (size != null) {
            _size = size;
        }
    }

    this.getPoints = function () {
        return _points;
    }; //End of getPoints

    this.getTargets = function () {
        return _targets;
    }; //End of getTargets

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

    this.setInputs = function (inputs) {
        for (var input in inputs) {
            if (inputs.hasOwnProperty(input)) {
                _inputs.push(input);
            } //End of if
        } //End of for in
    }; //End of this.setInputs

    this.setOutputs = function (outputs) {
        for (var output in outputs) {
            if (outputs.hasOwnProperty(output)) {
                _outputs.push(output);
            } //End of if
        } //End of for in
    }; //End of this.setOutputs


    this.getPropagationDelay = function () {
        return _tpd;
    }; //End of this.getPropagationDelay

    this.getContaminationDelay = function () {
        return _tcd;
    }; //End of this.getContaminationDelay

    this.setPropagationDelay = function (pd) {
        _tpd = pd;
    }; //End of this.setPropagationDelay

    this.setContaminationDelay = function (cd) {
        _tcd = cd;
    }; //End of setContaminationDelay

    this.getAvailableSizes = function () {
        return _availableSizes;
    }; //End of getAvailableSizes

    this.connect = function (gate) {

    }; //End of connect

} //End of module.exports
