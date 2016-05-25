'use strict';

var fs = require('fs-extra');
var TPS = require('../node_modules/thinplate/thinplate');
var async = require('async');

var  Util = require('./utility');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');


module.exports = function (filename) {

    var _filename = process.env.PWD + '/uploads/osu350.json';

    if (filename != null) {
        _filename = filename;
    } //End of if

    var _estimate = function (fitPoints, targets, point, cb) {
        var tps = new TPS();
        tps.compile(fitPoints, targets, function (err) {
            if (err) {
                console.error(err);
                cb(err);
            } //End of if
            tps.getValues([point], function (err, result) {
                if (err) {
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, result["ys"][0]);
                } //End of else
            }); //End of getValues
        }); //End of tps.compile
    }; //End of _estimate

    var _getEstimation = function (i, points, targets, point, delays, cb) {
        if (i < points.length) {
            _estimate(points[i], targets[i], point, function (err, result) {
                if (err) {
                    console.error(err);
                    cb(err);
                } else {
                    delays.push(result);
                    _getEstimation(i+1, points, targets, point, delays, cb);
                } //End of else
            }); //End of estimate
        } else {
            var max = Util.getMaximum(delays);
            var min = Util.getMinimum(delays);
            cb(null, {max: max, min: min});
        } //End of else
    } //End of _getEstimation

    var _getGateDelay = function (gate, inputTransition, outputCapacitance, cb) {
        if (gate == null || outputCapacitance == null || inputTransition == null) {
            cb({error: 'Either cellName or outputCapacitance or inputTransition is not provided.'});
        } //End of if

        var delays = [];

        var delayPoints = gate.getDelayPoints();
        var delayTargets = gate.getDelayTargets();

        _getEstimation(0,  delayPoints, delayTargets, [Number(inputTransition), Number(outputCapacitance)], delays, function (err, delay) {
            if (err) {
                cb(err);
            } else {
                gate.setPropagationDelay(delay.max);
                gate.setContaminationDelay(delay.min);
                cb(null, gate);
            } //End of else
        }); //End of _getEstimation
    }; //End of _getGateDelay

    var _getFlipFlopDelay = function (flipflop, inputTransition, outputCapacitance, cb) {

        if (flipflop == null || inputTransition == null || outputCapacitance == null) {
            cb({error: 'Either the cell JSON, inputTransition or outputCapacitance is not provided.'});
        } //End of if

        //Points and targets for estimation
        var tcqPoints = flipflop.getTcqPoints();
        var tcqTargets = flipflop.getTcqTargets();

        var tcqDelays = [];
        _getEstimation(0, tcqPoints, tcqTargets, [Number(inputTransition), Number(outputCapacitance)], tcqDelays, function (err, tcq) {
            if (err) {
                cb(err);
            } else {
                flipflop.setTCQ(tcq);
                cb(null, flipflop);
            } //End of else
        }); //End of _getEstimation
    }; //End of _getFlipFlopDelay

    var _getFlipFlopSlew = function (flipflop, inputTransition, outputCapacitance, cb) {

        var outputSlew = [];
        var outputSlewPoints = flipflop.getOutputSlewPoints();
        var outputSlewTargets = flipflop.getOutputSlewTargets();

        // console.log('-------------- Output Slew --------------');
        // console.log('============== Slew Points ==============');
        // console.log(outputSlewPoints);
        // console.log('=========== END Output Points ===========');
        // console.log('*************  Slew Targets *************');
        // console.log(outputSlewTargets);
        // console.log('************ END Output Points ************');
        // console.log('----------- END Output Slew -------------');

        _getEstimation(0, outputSlewPoints, outputSlewTargets, [Number(inputTransition), Number(outputCapacitance)], outputSlew, function (err, slew) {
            if (err) {
                cb(err);
            } else {
                flipflop.setOutputSlew(slew);
                cb(null, flipflop);
            } //End of else
        }); //End of _getEstimation
    }; //End of _getFlipFlopSlew

    var _getGateSlew = function (gate, inputTransition, outputCapacitance, cb) {

        var slews = [];

        var outputSlewPoints = gate.getOutputSlewPoints();

        var outputSlewTargets = gate.getOutputSlewTargets();

        _getEstimation(0, outputSlewPoints, outputSlewTargets, [Number(inputTransition), Number(outputCapacitance)], slews, function (err, slew) {
            if (err) {
                cb(err);
            } else {
                gate.setOutputSlew(slew);
                cb(null, gate);
            } //End of else
        }); //End of _getEstimation

    }; //End of _getGateSlew

    var _getSetupHold = function (flipflop, inputSlew, clockSlew, cb) {
        var holdPoints = flipflop.getHoldPoints();
        var holdTargets = flipflop.getHoldTargets();

        var setupPoints = flipflop.getSetupPoints();
        var setupTargets = flipflop.getSetupTargets();

        var holdDelays = [];
        var setupDelays = [];

        _getEstimation(0, setupPoints, setupTargets, [Number(inputSlew), Number(clockSlew)], setupDelays, function (err, data) {
            if (err) {
                cb(err);
            } else {
                flipflop.setSetup(data);
                _getEstimation(0, holdPoints, holdTargets, [Number(inputSlew), Number(clockSlew)], holdDelays, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        flipflop.setHold(data);
                        cb(null, flipflop);
                    } //End of else
                }); //Endof _getEstimation
            } //End of else
        }); //End of _getEstimation
    }; //End of _getSetupHold

    this.getCellByName = function (cellType, inputs, outputs, size, cb) {

        cb = (cb instanceof Function) ? cb : (size instanceof Function) ? size : (outputs instanceof Function) ? outputs: (inputs instanceof Function) ? inputs :  null;


        if (cellType == null) {
            cb({error:"Cell Type is not specified!!"});
        } //End of cellType

        var cell = cellType;
        var cellJSON;
        if (inputs != null && !(inputs instanceof Function)) {
            cell = cell + inputs;
        } //End of if

        if (Number(outputs) > 1 && outputs != null && !(outputs instanceof Function)) {
            cell = cell + outputs;
        } //End of if

        if (size != null && !(size instanceof Function)) {
            cell = cell + 'X' + size;
        } //End of if


        fs.readJson(_filename, function (err, data) {
            if (err) {
                cb(err);
            } else {
                cellJSON = data['cells'][cell];
                if (!cellJSON) {
                    cb({error: 'Either the cell is not present in the standard cell library or the cell name is misspelled.'});
                }
                if (cellJSON["is_ff"]) {
                    var flipflop = new FlipFlop(cellJSON);
                    flipflop.setType(cellType);
                    cb(null, flipflop);
                } else if (cellJSON["is_latch"]) {
                    cb(null, cellJSON);
                    //latch
                } else {
                    var gate = new Gate(cellJSON);
                    gate.setType(cellType);
                    cb(null, gate);
                } //End of else
            } //End of else
        }); //End of readJson
    }; //End of getCellByName

    this.getCellDelay = function (cell, inputTransition, outputCapacitance, cb) {

        if (cell == null || outputCapacitance == null || inputTransition == null) {
            cb({error: 'Either cell or outputCapacitance or inputTransition is not provided.'});
        } else if (cell instanceof Gate) {
            _getGateDelay(cell, inputTransition, outputCapacitance, function (err, gate) {
                if (err) {
                    console.error("----An error has occured------");
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, gate);
                } //End of else
            }); //End of _getGateDelay

        } else if (cell instanceof FlipFlop) {
            _getFlipFlopDelay(cell, inputTransition, outputCapacitance, function (err, flipflop) {
                if (err) {
                    console.error("----An error has occured------");
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, flipflop);
                } //End of else
            }); //End of _getFlipFlopDelay
        } //End of else if
    }; //End of getCellDelay

    this.getCellSetupHold = function (cell, inputSlew, clockSlew, cb) {
        if (!cell instanceof FlipFlop || cell == null || inputSlew == null || clockSlew == null) {
            cb({error: 'Either cell or inputSlew or clockSlew is not provided or of invalid type.'});
        } else {
            _getSetupHold(cell, inputSlew, clockSlew, function (err, flipflop) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, flipflop);
                } //End of if
            }); //End of _getSetupHold
        } //End of else
    }; //End of getCellSetup

    this.getCellOutputSlew = function (cell, inputTransition,  outputCapacitance, cb) {
        if (cell == null || outputCapacitance == null || inputTransition == null) {
            cb({error: 'Either cell or outputCapacitance or inputTransition is not provided.'});
        } else if (cell instanceof Gate) {
            _getGateSlew(cell, inputTransition, outputCapacitance, function (err, gate) {
                if (err) {
                    console.error("----An error has occured------");
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, gate);
                } //End of else
            }); //End of _getGateSlew

        } else if (cell instanceof FlipFlop) {
            _getFlipFlopSlew(cell, inputTransition, outputCapacitance, function (err, flipflop) {
                if (err) {
                    console.error("----An error has occured------");
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, flipflop);
                } //End of else
            }); //End of _getFlipFlopSlew
        } //End of else if
    }; //End of getCellOutputSlew

}; //End of module.exports
