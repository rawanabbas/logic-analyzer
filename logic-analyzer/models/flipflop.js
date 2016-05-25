'use strict';

var Util = require('./utility');

module.exports = function (cell, clk, inputs, outputs, tcq, setup, hold) {

    var _name;
    var _type;

    var _clk;

    var _inputs = [];
    var _inputPorts = [];

    var _outputs = [];
    var _outputPorts = [];

    var _edge;

    var _tcq;
    var _setup;
    var _hold;

    var _holdPoints = [];
    var _setupPoints = [];
    var _tcqPoints = [];
    var _outputSlewPoints = [];

    var _holdTargets = [];
    var _setupTargets = [];
    var _tcqTargets = [];
    var _outputSlewTargets = [];

    var _inputSlew = 0;
    var _clkSlew = 0;
    var _outputSlew;
    var _netCapacitance = 0;
    var _inputPinCapacitance = {};
    var _connectedPorts = {};
    var _connectedNets = {};

    var _arrivalTime = 0;
    var _requiredTime = Number.MAX_VALUE;
    var _slack;

    var _setClock = function (clk) {
        _clk = clk;
    }; //End of _setClock

    var _setEdge = function (edge) {
        _edge = (edge == "CLK") ? "posedge" : "negedge";
    }; //End of _setEdge

    var _setPins = function (pins) {
        var keys = Object.keys(pins);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] == "CLK") {
                _setClock(pins[keys[i]]);
            } else {
                if (pins[keys[i]]["direction"] == "input") {
                    _inputs.push(pins[keys[i]]);
                    _inputPorts.push(keys[i]);
                    _inputPinCapacitance[keys[i]] = pins[keys[i]]['capacitance'];
                } else {
                    _outputs.push(pins[keys[i]]);
                    _outputPorts.push(keys[i]);
                } //End of else
            } //End of else
        } //End of for
    }; //End of _setPins

    var _setOutputSlewPointsTargets = function (slew) {
        _outputSlewPoints.push(slew["rise_transition"]["points"]);
        _outputSlewPoints.push(slew["fall_transition"]["points"]);

        _outputSlewTargets.push(slew["rise_transition"]["targets"]);
        _outputSlewTargets.push(slew["fall_transition"]["targets"]);
    }; //End of _setOutputSlewPointsTargets

    var _setHoldPointsTargets = function (hold) {
        _holdPoints.push(hold["rise_constraint"]["points"]);
        _holdPoints.push(hold["fall_constraint"]["points"]);

        _holdTargets.push(hold["rise_constraint"]["targets"]);
        _holdTargets.push(hold["fall_constraint"]["targets"]);
    }; //End of _setHoldPointsTargets

    var _setSetupPointsTargets = function (setup) {
        _setupPoints.push(setup["rise_constraint"]["points"]);
        _setupPoints.push(setup["fall_constraint"]["points"]);

        _setupTargets.push(setup["rise_constraint"]["targets"]);
        _setupTargets.push(setup["fall_constraint"]["targets"]);
    }; //End of _setSetupPointsTargets

    var _setTcqPointsTargets = function (tcq) {
        _tcqPoints.push(tcq["cell_rise"]["points"]);
        _tcqPoints.push(tcq["cell_fall"]["points"]);

        _tcqTargets.push(tcq["cell_rise"]["targets"]);
        _tcqTargets.push(tcq["cell_fall"]["targets"]);
    }; //End of _setTcqPointsTargets

    if (cell != null) {
        _setEdge(cell["ff"]["clocked_on"]);
        _setPins(cell["pins"]);
        _setHoldPointsTargets(cell["hold_rising"] || cell["hold_falling"]);
        _setSetupPointsTargets(cell["setup_rising"] || cell["setup_falling"]);
        _setTcqPointsTargets(cell["pins"]["Q"]["timing"]["CLK"]);
        _setOutputSlewPointsTargets(cell["pins"]["Q"]["timing"]["CLK"]);
    } else {
        // TODO: Handle arguments passed one by one
    }

    this.setType = function (type) {
        _type = type;
    }; //End of setType

    this.getType = function () {
        return _type;
    }; //End of getType

    this.getInputs = function () {
        return _inputs;
    }; //End of getInputs

    this.getInputPorts = function () {
        return _inputPorts;
    }; //End of getInputPorts

    this.getOutputs = function () {
        return _outputs;
    }; //End of getOutputs

    this.getOutputPorts = function () {
        return _outputPorts;
    }; //End of getOutputPorts

    this.getMaximumTCQ = function () {
        return _tcq.max;
    }; //End of getMaximumTCQ

    this.getMinimumTCQ = function () {
        return _tcq.min;
    }; //End of getMinimumTCQ

    this.getTCQ = function () {
        return _tcq;
    }; //End of getTCQ

    this.getClock = function () {
        return _clk;
    }; //End of getClock

    this.getSetupTime = function () {
        return _setup;
    }; //End of getSetupTime

    this.getHoldTime = function () {
        return _hold;
    }; //End of getHoldTime

    this.getHoldPoints = function () {
        return _holdPoints;
    }; //End of getHoldPoints

    this.getSetupPoints = function () {
        return _setupPoints;
    }; //End of getHoldPoints

    this.getTcqPoints = function () {
        return _tcqPoints;
    }; //End of getTcqPoints

    this.getHoldTargets = function () {
        return _holdTargets;
    }; //End of getHoldPoints

    this.getSetupTargets = function () {
        return _setupTargets;
    }; //End of getHoldPoints

    this.getTcqTargets = function () {
        return _tcqTargets;
    }; //End of getHoldPoints

    this.getInstanceName = function () {
        return _name;
    }; //End of getInstanceName

    this.setInstanceName = function (name) {
        _name = name;
    }; //End of setInstanceName

    this.setTCQ = function (tcq) {
        _tcq = Util.clone(tcq);
    }; //End of setTCQ

    this.setSetup = function (setup) {
        _setup = Util.clone(setup);
    }; //End of _setSetup

    this.setHold = function (hold) {
        _hold = Util.clone(hold);
    }; //End of _setHold

    this.setInputSlew = function (inputSlew) {
        _inputSlew = inputSlew;
    }; //End of inputSlew

    this.getInputSlew = function () {
        return _inputSlew;
    };

    this.setNetCapacitance = function (netCapacitance) {
        _netCapacitance = netCapacitance;
    }; //End of setCapacitanceLoad

    this.getNetCapacitance = function () {
        return _netCapacitance;
    }; //End of getCapacitanceLoad

    this.setOutputSlew = function (outputSlew) {
        _outputSlew = Util.clone(outputSlew);
    }; // End of setOutputSlew

    this.getOutputSlew = function () {
        return _outputSlew;
    }; //End of getOutputSlew


    this.setClockSlew = function (clockSlew) {
        if (_clkSlew < clockSlew) {
            _clkSlew = clockSlew;
        } //End of if
    };

    this.getClockSlew = function () {
        return _clkSlew
    }; //End of getClockSlew

    this.getOutputSlewPoints = function () {
        return _outputSlewPoints;
    }; //End of getOutputSlewPoints

    this.getOutputSlewTargets = function () {
        return _outputSlewTargets;
    }; //End of getDelayTargets

    this.getDelay = function () {
        return {
            tcq: this.getTCQ(),
            setup: this.getSetupTime(),
            hold: this.getHoldTime(),
            slew: this.getOutputSlew()
        }; //End of return
    }; //End of getDelay

    this.getInputPinCapacitance = function (port) {
        if (port) {
            return _inputPinCapacitance.port;
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
        _connectedNets[port] = net;
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
        }
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
        return _slack = slack;
    };

}; //End of module.exports.FlipFlop
