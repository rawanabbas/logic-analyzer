'use strict';

var fs = require('fs-extra');
var TPS = require('../node_modules/thinplate/thinplate');

var  Util = require('./utility');
var Gate = require('./gate').Gate;
// var FlipFlop = require('./flipflop').FlipFlop;



module.exports.Liberty = function (filename) {

    var _technology;
    var _cells;
    var _filename = process.env.PWD + '/uploads/osu350.json';

    if (filename != null) {
        _filename = filename;
    } //End of if

    var _setTechnology = function (tech) {
        _technology = tech;
    }; //End of _setTechnology

    var _setCells = function (cells) {
        console.log('Inside _setCells()');
        _cells = Util.clone(cells);
    }; //End of _setCells

    var _estimate = function (fitPoints, targets, point) {
        var tps = new TPS();
        tps.compile(fitPoints, targets, function (err) {
            if (err) {
                console.error(err);
                throw Error(err);
            } //End of if
            tps.getValues([point], function (err, result) {
                if (err) {
                    console.error(err);
                    throw Error(err);
                } else {
                    return result;
                } //End of else
            }); //End of getValues
        }); //End of tps.compile
    }; //End of _estimate

    var _getGateDelay = function (gate, inputTransition, outputCapacitance, cb) {
        if (gate == null || outputCapacitance == null || inputTransition == null) {
            cb({error: 'Either cellName or outputCapacitance or inputTransition is not provided.'});
        } //End of if

        var tpd, tcd;

        var delays = [];

        var inputs = gate.getInputs();
        var outputs = gate.getOutputs();
        console.log('--------Inputs--------');
        console.log(inputs);
        console.log('-----END Inputs--------');
        var points = Util.clone(gate.getPoints());
        var targets = Util.clone(gate.getTargets());

        console.log('--------Targets--------');
        console.log(delays);
        console.log('------END Targets------');

        for (var i = 0; i < points.length; i++) {
            delays.push(_estimate(points[i], targets[i], [Number(inputTransition), Number(outputCapacitance)]));
        } //End of for

        console.log('--------Delays--------');
        console.log(delays);
        console.log('------END Delays------');

        tpd = Util.getMaximum(delays);
        tcd = Util.getMinimum(delays);

        // var cellRise = [];
        // var cellFall = [];
        //
        // for (var i = 0; i < outputs.length; i++) {
        //     for (var j = 0; j < inputs.length; j++) {
        //
        //         cellRise.push(outputs[i]['timing'][inputs[j]["name"]]["cell_rise"]["table"]);
        //         cellFall.push(outputs[i]['timing'][inputs[j]["name"]]["cell_fall"]["table"]);
        //     } //End of for j
        // } //End of for i
        //
        // var xValues = outputs[0]['timing'][inputs[0]["name"]]["cell_rise"]["x_values"];
        // var yValues = outputs[0]['timing'][inputs[0]["name"]]["cell_rise"]["y_values"];
        //
        // var fitpoints = [];
        // var targetsPD = [];
        // var targetsCD = [];
        //
        // for (var i = 0; i < xValues.length; i++) {
        //     fitpoints.push([Number(xValues[i]), Number(yValues[i])]);
        //     targetsPD.push(getMaximum(cellFall, yValues[i], xValues[i]));
        //     targetsCD.push(getMaximum(cellRise, yValues[i], xValues[i]));
        // } //End of for
        //
        // tpd = _estimate(fitpoints, targetsPD, [Number(inputTransition), Number(outputCapacitance)]);
        // tcd = _estimate(fitpoints, targetsCD, [Number(inputTransition), Number(outputCapacitance)]);
        //
        // if (tcd > tpd) {
        //     tpd = [tcd, tcd = tpd][0];
        // } //End of if
        console.log("tpd: %d", tpd);
        console.log("tcd: %d", tcd);
        gate.setPropagationDelay(tpd);
        gate.setContaminationDelay(tcd);

        cb(null, gate);
    }; //End of _getGateDelay

    var _getFlipFlopDelay = function (flipflop, inputTransition, outputCapacitance, cb) {

        if (flipflop == null || inputTransition == null || outputCapacitance == null) {
            cb({error: 'Either the cell JSON, inputTransition or outputCapacitance is not provided.'});
        } //End of if



    }; //End of _getFlipFlopDelay

    this.parseLibertyFile = function (cb) {
        console.log('Inside parseLibertyFile');
        fs.readJson(_filename, function (err, data) {
            if (err) {
                console.error("An error has occured while reading the liberty file.");
                if (cb) {
                    cb(err);
                }
                throw Error(err);
            } else {
                console.log('Inside else parseLibertyFile');
                // _setCells(data);
                _cells = Util.clone(data['cells']);
                console.log('After _cells = clone;');
                if (!cb) {
                    cb(null, data);
                } //End of if
            } //End of else
        });//End of readJson
    } //End of parseLibertyFile

    this.getTechnology = function () {
        return _technology;
    }; //End of getTechnology

    this.getCells = function () {
        return _cells;
    }; //End of getCells

    this.getCellByName = function (cellType, inputs, outputs, size, cb) {
        console.log('Inside getCellByName.');

        cb = (cb instanceof Function) ? cb : (size instanceof Function) ? size : (outputs instanceof Function) ? outputs: (inputs instanceof Function) ? inputs :  null;

        if (!cb) {
            cb = function (err, data) {
                if (err) {
                    throw Error(err);
                } else {
                    return data;
                }
            }
        }

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


        console.log(cell);
        fs.readJson(_filename, function (err, data) {
            if (err) {
                cb(err);
            } else {
                cellJSON = data['cells'][cell];
                if (cellJSON["is_ff"]) {
                    cb(null, cellJSON);
                    // var flipflop = new FlipFlop(cellJSON);
                    // cb(null, flipflop);
                } else if (cellJSON["is_latch"]) {
                    cb(null, cellJSON);
                    //latch
                } else {
                    var gate = new Gate(cellJSON);
                    cb(null, gate);
                } //End of else
            } //End of else
        }); //End of readJson
    }; //End of getCellByName

    this.getCellDelay = function (cell, outputCapacitance, inputTransition, cb) {

        if (cell == null || outputCapacitance == null || inputTransition == null) {
            cb({error: 'Either cellName or outputCapacitance or inputTransition is not provided.'});
        } else if (cell instanceof Gate) {
            _getGateDelay(cell, outputCapacitance, inputTransition, function (err, gate) {
                if (err) {
                    console.error("----An error has occured------");
                    console.error(err);
                    cb(err);
                } else {
                    cb(null, gate);
                } //End of else
            }); //End of _getGateDelay

        } else if (cell instanceof FlipFlop) {
            var tcq, setup, hold;

        } //End of else if
    }; //End of getCellDelay

}; //End of module.exports
