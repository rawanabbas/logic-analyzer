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
    var _setup = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };
    var _hold = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };

    var _holdPoints = [];
    var _setupPoints = [];
    var _tcqPoints = [];

    var _holdTargets = [];
    var _setupTargets = [];
    var _tcqTargets = [];

    var _inputSlew = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };

    var _capacitanceLoad = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };

    var _outputSlew = {
        max: Number.MIN_VALUE,
        min: Number.MAX_VALUE
    };

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

    var _setTcqPointsTargets = function (tcq) {

        _tcqPoints.push(tcq["cell_rise"]["points"]);
        _tcqPoints.push(tcq["rise_transition"]["points"]);

        _tcqPoints.push(tcq["cell_fall"]["points"]);
        _tcqPoints.push(tcq["fall_transition"]["points"]);

        _tcqTargets.push(tcq["cell_rise"]["targets"]);
        _tcqTargets.push(tcq["rise_transition"]["targets"]);

        _tcqTargets.push(tcq["cell_fall"]["targets"]);
        _tcqTargets.push(tcq["fall_transition"]["targets"]);
    }; //End of _setTcqPointsTargets

    if (cell != null) {
        _setEdge(cell["ff"]["clocked_on"]);
        _setPins(cell["pins"]);
        _setHoldPointsTargets(cell["hold_rising"] || cell["hold_falling"]);
        _setSetupPointsTargets(cell["setup_rising"] || cell["setup_falling"]);
        _setTcqPointsTargets(cell["pins"]["Q"]["timing"]["CLK"]);
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
        _inputSlew = Util.clone(inputSlew);
    }; //End of inputSlew

    this.getInputSlew = function () {
        return _inputSlew;
    };

    this.setCapacitanceLoad = function (capacitanceLoad) {
        _capacitanceLoad = Util.clone(capacitanceLoad);
    }; //End of setCapacitanceLoad

    this.getCapacitanceLoad = function () {
        return _capacitanceLoad;
    }; //End of getCapacitanceLoad

    this.setOutputSlew = function (outputSlew) {
        _outputSlew = Util.clone(outputSlew);
    }; // End of setOutputSlew

    this.getOutputSlew = function () {
        return _outputSlew;
    }; //End of getOutputSlew

}; //End of module.exports.FlipFlop
