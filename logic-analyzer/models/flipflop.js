'use strict';

var Util = require('./utility');

module.exports = function (cell, clk, inputs, outputs, tcq, setup, hold) {

    var _clk;

    var _inputs = [];
    var _inputPorts = [];

    var _outputs = [];
    var _outputPorts = [];

    var _edge;

    var _tcq = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };
    var _setup = {};
    var _hold = {};

    var _holdPoints = [];
    var _setupPoints = [];

    var _holdTargets = [];
    var _setupTargets = [];

    var _setClock = function (clk) {
        _clk = clk;
    }; //End of _setClock

    var _setEdge = function (edge) {
        _edge = (edge == "CLK") ? "posedge" : "neg";
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
                } else {
                    _outputs.push(pins[keys[i]]);
                    _outputPorts.push(keys[i]);
                } //End of else
            } //End of else
        } //End of for
    }; //End of _setPins

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

    if (cell != null) {
        _setEdge(cell["ff"]["clocked_on"]);
        _setPins(cell["pins"]);
        _setHoldPointsTargets(cell["hold_rising"]);
        _setSetupPointsTargets(cell["setup_rising"]);
    } else {
        // TODO: Handle arguments passed one by one
    }

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

    this.getHoldTargets = function () {
        return _holdTargets;
    }; //End of getHoldPoints

    this.getSetupTargets = function () {
        return _setupTargets;
    }; //End of getHoldPoints

    this.setSetup = function (setup) {
        _setup = Util.clone(setup);
    }; //End of _setSetup

    this.setHold = function (hold) {
        _hold = Util.clone(hold);
    }; //End of _setHold


}; //End of module.exports.FlipFlop
