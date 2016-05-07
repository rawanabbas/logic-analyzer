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
                        } else {
                            if (!cell.aat || cell.aat < aat) {
                                cell.aat = aat;
                            } //End of if
                        } //End of else
                    } //End of else
                } //End of for j
            } //End of if
        } //End of for
    }; //End of _calculateArrivalTime

    var _calculateRequiredTime = function () {
        console.log('--------------------------------------------------------------------------');
        console.log('Calculating Required Time...');
        // var nodes = _graph.nodes();
        var nodes = Graphlib.alg.topsort(_graph);
        for (var i = nodes.length - 1; i >= 0; i--) {
            console.log(nodes[i]);
            var inEdges = _graph.inEdges(nodes[i]);
            var rat;
            var bits;
            console.log("-======-=====-=======-");
            console.log(_graph.node(nodes[i]).instance_name != "clk");
            console.log(_graph.node(nodes[i]).instance_name);
            console.log("-======-=====-=======-");
            if (_graph.node(nodes[i]) instanceof Gate || _graph.node(nodes[i]) instanceof FlipFlop) {
                rat = _graph.node(nodes[i]).getRAT();
            } else if (_graph.node(nodes[i]).instance_name != "clk" && _graph.node(nodes[i]).instance_name) {
                rat = _graph.node(nodes[i]).output_delay;
                bits = _graph.node(nodes[i]).bits;
                console.log(bits);
            } else if (_graph.node(nodes[i]).instance_name == "clk") {
                inEdges = null;
            } //End of else if
            console.log(rat);
            console.log('InEdges......');
            console.log(inEdges);
            if (inEdges) {
                for (var j = 0; j < inEdges.length; j++) {
                    var cell = _graph.node(inEdges[j]["v"]);
                    if (rat instanceof Array) {
                        if (cell instanceof Gate || cell instanceof FlipFlop) {
                            console.log(cell.getInstanceName());
                            var index = bits.indexOf(_graph.edge(inEdges[j]));
                            console.log(index);
                            console.log(_graph.edge(inEdges[j]));
                            console.log("RAT");
                            console.log(rat);
                            var parentRAT = Math.max(rat[index].cell_rise, rat[index].cell_fall);
                            var cellRAT = parentRAT;
                            console.log('ParentRAT');
                            console.log(parentRAT);
                            if (cell instanceof Gate) {
                                console.log('Cell is am instanceof a Gate');
                                cellRAT += cell.getDelay().delay.tcd;
                                console.log(parentRAT);
                                console.log(cellRAT);
                                if (cell.getRAT() > cellRAT) {
                                    cell.setRAT(cellRAT);
                                }
                            } else {
                                console.log('Cell is an instanceof a FlipFlop');
                                cellRAT += Math.min(cell.getDelay().tcq.min, cell.getDelay().hold.max);
                                if (cell.getRAT() > cellRAT) {
                                    cell.setRAT(cellRAT);
                                }
                            } //End of else
                        } //End of if
                    } else {
                        console.log('RAT is not an array!');
                        var cellRAT = rat;
                        if (cell instanceof Gate) {
                            console.log(cell.getInstanceName());
                            console.log('It is a Gate');
                            cellRAT += cell.getDelay().delay.tcd;
                            console.log(cellRAT);
                            if (cell.getRAT() > cellRAT) {
                                cell.setRAT(cellRAT);
                            } //End of if
                        } else if (cell instanceof FlipFlop) {
                            console.log(cell.getInstanceName());
                            console.log('It is a FlipFlop');
                            console.log(_clock.getClockSkew(cell.getInstanceName()));
                            cellRAT += Math.min(cell.getDelay().tcq.min, _clock.getClockSkew(cell.getInstanceName()) + cell.getDelay().hold.max);
                            if (cell.getRAT() > cellRAT) {
                                cell.setRAT(cellRAT);
                            } //End of if
                        } else {
                            if (!cell.rat || cell.rat < rat) {
                                cell.rat = rat;
                            } //End of if
                        } //End of else
                    } //End of else
                } //End of for j
            } //End of if
        } //End of for
    }; //End fo _calculateRequiredTime

    var _calculateSlack = function () {
        _printARAT();
        var nodes = _graph.nodes();
        for (var i = 0; i < nodes.length; i++) {
            if (_graph.node(nodes[i]) instanceof Gate || _graph.node(nodes[i]) instanceof FlipFlop) {
                var aat = _graph.node(nodes[i]).getAAT();
                var rat = _graph.node(nodes[i]).getRAT();
                _graph.node(nodes[i]).setSlack(rat - aat);
            } else {
                var cell = _graph.node(nodes[i]);
                var rat = cell.rat;
                var aat = cell.aat;
                console.log('Cell ', nodes[i], ' RAT: ', rat, ' AAT: ', aat);
                if (typeof cell.slack === 'undefined') {
                    cell.slack = rat - aat;
                } //End of if
            } //End of else
        } //End of for i
        _printSlack();
    }; //End of_calculateSlack

    var _printSlack = function () {
        var nodes = _graph.nodes();
        for (var i = 0; i < nodes.length; i++) {
            if (_graph.node(nodes[i]) instanceof Gate || _graph.node(nodes[i]) instanceof FlipFlop) {
                console.log('Cell ', nodes[i], ' Slack: ', _graph.node(nodes[i]).getSlack());
            } else {
                console.log('Cell ', nodes[i], 'Slack: ', _graph.node(nodes[i]).slack);
            } //End of else
        } //End of for
    }; //End of _printSlack

    var _printTimingPaths = function () {

    };

    var _getFlipFlops = function () {
        var flipflops = [];
        var nodes = _graph.nodes();
        for (var i = 0; i < nodes.length; i++) {
            if (_graph.node(nodes[i]) instanceof FlipFlop) {
                flipflops.push(_graph.node(nodes[i]));
            } //End of if
        } //End of for i
        return flipflops;
    }; //End of _getFlipFlops

    var _calculateHoldViolation = function () {
        var flipflops = Util.clone(_getFlipFlops());
        var holds = {};
        for (var i = 0; i < flipflops.length; i++) {
            if (flipflops[i].getAAT() < Math.abs(flipflops[i].getHoldTime().max)) {
                holds[flipflops[i]] = flipflops[i].getAAT() - flipflops[i].getHoldTime().max;
            }
            // var inEdges = _graph.inEdges(flipflops[i].getInstanceName());
            // for (var j = 0; j < inEdges.length; j++) {
            //     var cell = _graph.node(inEdges[j]["v"]);
            //     if (cell instanceof Gate) {
            //         if (cell.getAAT() < flipflops[i].getHoldTime().max) {
            //             holds[flipflops[i]] = cell.getAAT() - flipflops[i].getHoldTime().max;
            //         } //End of if
            //     } else {
            //         if (cell.aat < flipflops[i].getHoldTime().max) {
            //             holds[flipflops[i].getInstanceName()] = cell.getAAT() - flipflops[i].getHoldTime().max;
            //         } //End of if
            //     } //End of if
            // } //End of for j
        } //End of for
        console.log('HOLD VIOLATIONS');
        console.log(holds);
        return holds;
    }; //End of _calculateHoldViolation

    var _calculateSetupViolation = function () {
        var cycle = _constraints.getClock();
        var flipflops = Util.clone(_getFlipFlops());
        var setups = {};
        for (var i = 0; i < flipflops.length; i++) {
            if (flipflops[i].getAAT() > Math.abs(cycle - flipflops[i].getSlack())) {
                setups[flipflops[i]] = cycle - flipflops[i].getSlack();
            }
        } //End of for
        console.log('SETUP VIOLATIONS');
        console.log(setups);
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

    this.generateTimingReport = function () {

    };

    this.analyze = function () {
        _constructTimingGraph(function () {
            _calculateArrivalTime();
            _calculateRequiredTime();
            _calculateSlack();
            _calculateHoldViolation();
            _calculateSetupViolation();
        });
    };

};
