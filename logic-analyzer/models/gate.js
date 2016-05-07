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
    var _connectedNets = {};
    var _connectedPorts = {};


    var _outputSlew;
    var _inputSlew = 0;
    var _netCapacitance = 0;
    var _inputPinCapacitance = {};

    var _arrivalTime = 0;
    var _requiredTime = Number.MAX_VALUE;
    var _slack;

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
                _inputPinCapacitance[keys[i]] = port['capacitance'];
            } else if (direction == "output") {
                _outputs.push(port);
                _outputPorts.push(keys[i]);
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

    this.getInstanceName = function () {
        return _name;
    }; //End of getInstanceName

    this.setInstanceName = function (name) {
        _name = name;
    }; //End of setInstanceName

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

    this.setNetCapacitance = function (netCapacitance) {
        _netCapacitance = netCapacitance;
    }; //End of setCapacitanceLoad

    this.getNetCapacitance = function () {
        return _netCapacitance;
    }; //End of getCapacitanceLoad

    this.setInputSlew = function (inputSlew) {
        _inputSlew = inputSlew;
    }; //End of inputSlew

    this.getInputSlew = function () {
        return _inputSlew;
    }; //End of getInputSlew

    this.getDelay = function () {
        return {
            delay: {
                tpd: this.getPropagationDelay(),
                tcd: this.getContaminationDelay()
            },
            slew: this.getOutputSlew()
        }; //End of return
    }; //End of getDelay

    this.getInputPinCapacitance = function (port) {
        if (port) {
            return _inputPinCapacitance[port];
        }
        return _inputPinCapacitance;
    }; //End of getInputPinCapacitance

    this.setInputPinCapacitance = function (port, capacitance) {
        _inputPinCapacitance[port] += capacitance;
    }; //End of setInputPinCapacitance

    this.connect = function (port, net) {
        var index = (_inputPorts.indexOf(port) > -1) ? _inputPorts.indexOf(port) : _outputPorts.indexOf(port);
        if (_inputPorts.indexOf(port) > -1) {
            _inputs[index]["net"] = [];
            _inputs[index]["net"].push(net);
        } else if (_outputPorts.indexOf(port) > -1) {
            _outputs[index]["net"] = [];
            _outputs[index]["net"].push(net);
        } //End of else
        _connectedNets[net] = port;
    }; //End of connect

    this.getConnectedNets = function (port) {
        // console.log(port);
        if (port) {
            return _connectedNets[port];
        } else {
            return _connectedNets;
        } //End of else
    }; //End of getConnectedNets

    this.getConnectedPorts = function () {
        return _connectedPorts;
    };

    this.setInputSlew = function (slew) {
        _inputSlew = slew;
    }; //End of setInputSlew

    this.getInputSlew =  function () {
        return _inputSlew
    }; //End of getInputSlew

    this.setOutputCapacitance = function (capacitance) {
        console.log('Cap: ', capacitance);
        if (_netCapacitance < capacitance) {
            _netCapacitance = capacitance;
        } //End of if
    }; //End of setOutputCapacitance

    this.getOutputCapacitance = function () {
        return _netCapacitance;
    }; //End of outputCapacitance

    this.getAAT = function () {
        return _arrivalTime;
    };

    this.setAAT = function (aat) {
        _arrivalTime = aat;
    };

    this.getRAT = function () {
        return _requiredTime;
    };

    this.setRAT = function (rat) {
        _requiredTime = rat;
    };

    this.getSlack = function () {
        return _slack;
    };

    this.setSlack = function (slack) {
        _slack = slack;
    };
}; //End of module.exports
