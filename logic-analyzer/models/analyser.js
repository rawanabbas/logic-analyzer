'use strict';

var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;
var async = require('async');

var Util = require('./utility');
var Liberty = require('./liberty');
var Netlist = require('./netlist');
var Constraint = require('./constraint');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');
var Clock = require('./clock');

module.exports = function (netlist, constraint, capacitance, clk, cb) {

    var _graph;
    var _liberty = new Liberty();
    var _constraints = new Constraint(constraint);
    var _clock = new Clock(clk);
    var Analyser = this;
    var _netlist = new Netlist(netlist, constraint, capacitance, clk, function (err, graph) {
        if (err) {
            console.error(err);
            cb(err);
        } else {
            console.log('Netlist parsed!');
            _graph = graph;
            Analyser.analyze();
            cb(null, _graph);
        } // End of else
    }); // End of new Netlist

    var _getCellDelay = function (node, cb) {
        if (node instanceof Gate || node instanceof FlipFlop) {
            _liberty.getCellDelay(node, node.getInputSlew(), node.getOutputCapacitance(), function (err, cell) {
                if (err) {
                    cb(err);
                } else {
                    if (node instanceof FlipFlop) {
                        _liberty.getCellSetupHold(node, node.getInputSlew(), node.getClockSlew(), function (err, ff) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, ff);
                            } //End of else
                        }); //End of getCellSetupHold
                    } else {
                        cb(null, cell);
                    } //End of else
                } //End of else
            }); //End of getCellDelay
        } else {
            cb(null, node);
        } //End of else
    }; //End of _getCellDelay

    var _constructTimingGraph = function (cb) {
        var nodes = _graph.nodes();
        console.log('_Constructing Timing Graph....');
        console.log(nodes);
        async.each(nodes, function (node, next) {
            // console.log(_graph.node(node));
            if (_graph.node(node) instanceof Gate || _graph.node(node) instanceof FlipFlop) {
                console.log(node);
                _getCellDelay(_graph.node(node), function (err, cell) {
                    if (err) {
                        console.log(err);
                        next(err);
                    } else {
                        console.log("_getCellDelay()");
                        if (cell instanceof Gate || cell instanceof FlipFlop) {
                            console.log(cell.getDelay());
                        }
                        next();
                    } //End of else
                }); //End of _getCellDelay
            } else {
                next();
            } //End of else
        }, cb); //End of async.each
    };//End of  _constructTimingGraph

    var _calculateArrivalTime = function () {
        console.log('Calculating Arrival Time.....');
        var nodes = _graph.nodes();
        for (var i = 0; i < nodes.length; i++) {
            console.log('Parent!');
            console.log(nodes[i]);
            var outEdges = _graph.outEdges(nodes[i]);
            var aat;
            var bits = [];
            if (_graph.node(nodes[i]) instanceof Gate || _graph.node(nodes[i]) instanceof FlipFlop) {
                aat = _graph.node(nodes[i]).getAAT();
            } else if (_graph.node(nodes[i]).instance_name != "clk" && _graph.node(nodes[i]).instance_name) {
                aat = _graph.node(nodes[i]).input_delay;
                bits = _graph.node(nodes[i]).bits;
            } else if (_graph.node(nodes[i]) == "clk") {
                outEdges = null;
            }
            if (outEdges && _graph.node(nodes[i]).instance_name != "clk") {
                for (var j = 0; j < outEdges.length; j++) {
                    console.log('Child!');
                    console.log(outEdges[j]["w"]);
                    var cell = _graph.node(outEdges[j]["w"]);
                    if (aat instanceof Array) {
                        if (cell instanceof Gate || cell instanceof FlipFlop) {
                            var index = bits.indexOf(_graph.edge(outEdges[j]));
                            var parentAAT = Math.max(aat[index].cell_rise, aat[index].cell_fall);
                            var cellAAT = parentAAT;
                            if (cell instanceof Gate) {
                                console.log('Cell is am instanceof a Gate');
                                console.log(cell.getDelay().delay);
                                cellAAT += cell.getDelay().delay.tpd;
                                console.log(cellAAT);
                                if (cell.getAAT() < cellAAT) {
                                    cell.setAAT(cellAAT);
                                }
                            } else {
                                console.log('Cell is an instanceof a FlipFlop');
                                cellAAT += Math.max(cell.getDelay().tcq.max, _clock.getClockSkew(cell.getInstanceName()) + cell.getDelay().setup.max);
                                if (cell.getAAT() < cellAAT) {
                                    cell.setAAT(cellAAT);
                                }
                            } //End of else
                        } //End of if
                    } else {
                        console.log('AAT is not an array!');
                        var cellAAT = aat;
                        if (cell instanceof Gate) {
                            console.log('It is a Gate');
                            console.log(cell.getInstanceName());
                            cellAAT += cell.getDelay().delay.tpd;
                            console.log(cellAAT);
                            if (cell.getAAT() < cellAAT) {
                                cell.setAAT(cellAAT);
                            } //End of if
                        } else if (cell instanceof FlipFlop) {
                            console.log('It is a FlipFlop');
                            cellAAT += Math.max(cell.getDelay().tcq.max, _clock.getClockSkew(cell.getInstanceName()) + cell.getDelay().setup.max);
                            if (cell.getAAT() < cellAAT) {
                                cell.setAAT(cellAAT);
                            } //End of if
                        } //End of else if
                    } //End of else
                } //End of for j
            } //End of if
        } //End of for
    }; //End of _calculateArrivalTime

    var _calculateRequiredTime = function () {

    };

    var _calculateSlack = function () {

    };

    var _printTimingPaths = function () {

    };

    var _printARAT = function () {
        var nodes = _graph.nodes();
        for (var i = 0; i < nodes.length; i++) {
            var cell = _graph.node(nodes[i]);
            if (cell instanceof Gate || cell instanceof FlipFlop) {
                console.log('=============================================');
                console.log("Cell ", nodes[i], " AAT: ");
                console.log(cell.getAAT());
                console.log("Cell ", nodes[i], " RAT: ");
                console.log(cell.getRAT());
            } //End of if
        } //End of for i
    }; //End of _printARAT

    this.analyze = function () {
        _constructTimingGraph(function () {
            _calculateArrivalTime();
            _calculateRequiredTime();
            // _printARAT();
            _calculateSlack();
            // _calculateHoldViolation();
            // _calculateSetupViolation();
        });
    };

};
