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
    var _map = {};
    var _holds = {};
    var _setups = {};
    this.cb = cb;
    var _netlist = new Netlist(netlist, constraint, capacitance, clk, function (err, graph) {
        if (err) {
            console.error(err);
            Analyser.cb(err);
        } else {
            console.log('Netlist parsed!');
            _graph = graph;
            var nodes = _graph.nodes();
            for (var i = 0; i < nodes.length; i++) {
                _map[nodes[i]] = [];
                var children = _graph.successors(nodes[i])
                for (var j = 0; j < children.length; j++) {
                    _map[nodes[i]].push(children[j]);
                } //End of for j
            } //End of for i
            Analyser.cb();
            // Analyser.analyze(cb);
            // cb(null, _graph);
        } // End of else
    }); // End of new Netlist

    var _getCellDelay = function (node, callback) {
        if (node instanceof Gate || node instanceof FlipFlop) {
            _liberty.getCellDelay(node, node.getInputSlew(), node.getOutputCapacitance(), function (err, cell) {
                if (err) {
                    callback(err);
                } else {
                    if (node instanceof FlipFlop) {
                        _liberty.getCellSetupHold(node, node.getInputSlew(), node.getClockSlew(), function (err, ff) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, ff);
                            } //End of else
                        }); //End of getCellSetupHold
                    } else {
                        callback(null, cell);
                    } //End of else
                } //End of else
            }); //End of getCellDelay
        } else {
            callback(null, node);
        } //End of else
    }; //End of _getCellDelay

    var _constructTimingGraph = function (callback) {
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
        }, callback); //End of async.each
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
        for (var i = 0; i < flipflops.length; i++) {
            if (flipflops[i].getAAT() < Math.abs(flipflops[i].getHoldTime().max)) {
                _holds[flipflops[i].getInstanceName()] = flipflops[i].getAAT() - flipflops[i].getHoldTime().max;
            }
        } //End of for
        console.log('HOLD VIOLATIONS');
        console.log(_holds);
    }; //End of _calculateHoldViolation

    var _calculateSetupViolation = function () {
        var cycle = _constraints.getClock();
        var flipflops = Util.clone(_getFlipFlops());
        for (var i = 0; i < flipflops.length; i++) {
            if (flipflops[i].getAAT() > Math.abs(cycle - flipflops[i].getSlack())) {
                _setups[flipflops[i].getInstanceName()] = cycle - flipflops[i].getSlack();
            }
        } //End of for
        console.log('SETUP VIOLATIONS');
        console.log(_setups);
    };

    var _getInputToFlipFlop = function () {
        function weight(e) {
            return _graph.edge(e);
        }
        console.log("Input -> FlipFlop");
        var flipflops = Util.clone(_getFlipFlops());
        var paths = {};
        var inputs = _graph.sources();
        for (var i = 0; i < flipflops.length; i++) {
            paths[flipflops[i].getInstanceName()] = [];
            for (var j = 0; j < inputs.length; j++) {
                if (_graph.node(inputs[j]).instance_name != "clk") {
                    var dijkstra = Graphlib.alg.dijkstra(_graph, inputs[j], weight);
                    var distance = dijkstra[flipflops[i].getInstanceName()].distance;
                    var predecessor = flipflops[i].getInstanceName();
                    while (distance > 0) {
                        predecessor = dijkstra[predecessor].predecessor;
                        if (dijkstra[predecessor]) {
                            distance = dijkstra[predecessor].distance;
                        } else {
                            distance = -1;
                        }
                        paths[flipflops[i].getInstanceName()].push(predecessor);
                    } //End of while
                } //End of if
            } //End of for j
        } //End of for i
        console.log(paths);
    }; //End of _getInputToFlipFlop

    var _getFlipFlopToFlipFlop = function () {
        console.log("FlipFlop -> FlipFlop");
        function weight(e) {
            return _graph.edge(e);
        }
        var flipflops = Util.clone(_getFlipFlops());
        var paths = {};
        for (var i = 0; i < flipflops.length; i++) {
            paths[flipflops[i].getInstanceName()] = [];
            for (var j = 0; j < flipflops.length; j++) {
                if (flipflops[i].getInstanceName() != flipflops[j].getInstanceName()) {
                    console.log('---------------');
                    console.log(flipflops[i].getInstanceName());
                    console.log(flipflops[j].getInstanceName());
                    console.log('---------------');
                    var dijkstra = Graphlib.alg.dijkstraAll(_graph, weight);
                    // console.log(dijkstra);
                    var distance = dijkstra[flipflops[i].getInstanceName()][flipflops[j].getInstanceName()].distance;
                    if (dijkstra[flipflops[i].getInstanceName()][flipflops[j].getInstanceName()].predecessor) {
                        paths[flipflops[i].getInstanceName()].push(flipflops[j].getInstanceName());
                        var predecessor = dijkstra[flipflops[i].getInstanceName()][flipflops[j].getInstanceName()].predecessor;
                        while (distance >  0) {
                            paths[flipflops[i].getInstanceName()].push(predecessor);
                            predecessor = dijkstra[flipflops[i].getInstanceName()][predecessor].predecessor;
                            // console.log(predecessor);
                            distance =  dijkstra[flipflops[i].getInstanceName()][predecessor].distance;
                        }
                    }
                } //End of if
            } //End of for j
        } //End of for i
        console.log(paths);
    }; //End of _getFlipFlopToFlipFlop

    var _getFlipFlopToOutput = function () {
        console.log('FlipFlop -> Output');
        function weight(e) {
            return _graph.edge(e);
        }
        var flipflops = Util.clone(_getFlipFlops());
        var paths = {};
        var outputs = _graph.sinks();
        for (var i = 0; i < flipflops.length; i++) {
            paths[flipflops[i].getInstanceName()] = [];
            for (var j = 0; j < outputs.length; j++) {
                var dijkstra = Graphlib.alg.dijkstraAll(_graph, weight);
                // console.log(dijkstra);
                var distance = dijkstra[flipflops[i].getInstanceName()][outputs[j]].distance;
                if (dijkstra[flipflops[i].getInstanceName()][outputs[j]].predecessor) {
                    paths[flipflops[i].getInstanceName()].push(outputs[j]);
                    var predecessor = dijkstra[flipflops[i].getInstanceName()][outputs[j]].predecessor;
                    while (distance >  0) {
                        paths[flipflops[i].getInstanceName()].push(predecessor);
                        predecessor = dijkstra[flipflops[i].getInstanceName()][predecessor].predecessor;
                        // console.log(predecessor);
                        distance =  dijkstra[flipflops[i].getInstanceName()][predecessor].distance;
                    }
                }
            } //End of if

            // } //End of for j
        } //End of for i
        console.log(paths);
    }; //End of _getFlipFlopToOutput

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

    this.generateTimingReport = function (callback) {
        var report = {};
        var path = {};
        var slacks = [];
        var preorder = [];
        var sources = _graph.sources();
        for (var i = 0; i < sources.length; i++) {
            preorder.push(sources[i]);
            report[sources[i]] = [];
            while (preorder.length) {
                var node  = preorder.pop();
                if (node instanceof Object) {
                    report[sources[i]].push(node);
                }
                var children = _graph.successors(node.node || node);
                for (var j = 0; j < children.length; j++) {
                    preorder.push({node: children[j], parent: ((typeof node.node !== 'undefined') ? [].concat(node.node).concat(node.parent) : sources[i])});
                } //End of for
            } //End of while
        } //End of for
        for (var source in report) {
            if (report.hasOwnProperty(source)) {
                for (var i = 0; i < report[source].length; i++) {
                    console.log(report[source][i]);
                }
            }
        }
        for (var source in report) {
            if (report.hasOwnProperty(source)) {
                path[source] = [];
                for (var i = 0; i < report[source].length; i++) {
                    if (_graph.sinks().indexOf(report[source][i].node) > -1) {
                        path[source].push([].concat(report[source][i].node).concat(report[source][i].parent));
                    } //End of if
                } //End of for i
            } //End of if
        } //End of for
        callback(path);
    }; //End of generateTimingReport

    this.getTimingPaths = function () {
        _getInputToFlipFlop();
        _getFlipFlopToFlipFlop();
        _getFlipFlopToOutput();
    }; //End of getTimingPaths

    this.analyze = function (callback) {
        var Analyser = this;
        _constructTimingGraph(function () {
            _calculateArrivalTime();
            _calculateRequiredTime();
            _calculateSlack();
            _calculateHoldViolation();
            _calculateSetupViolation();
            callback(_graph, _setups, _holds);
        });
    };

};
