'use strict';

var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;
var async = require('async');

var Util = require('./utility');
var Liberty = require('./liberty');
var Netlist = require('./netlist');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');
var Clock = require('./clock');

module.exports = function (netlist, constraint, capacitance, clk, cb) {

    var _graph;
    var _liberty = new Liberty();
    var _constraints = new Constraint(constraint);
    var Analyser = this;
    var _netlist = new Netlist(netlist, constraint, capacitance, clk, function (err, graph) {
        if (err) {
            console.error(err);
            cb(err);
        } else {
            console.log('Netlist parsed!');
            _graph = graph;
            Analyser.analyze();
            cb(null);
        } // End of else
    }); // End of new Netlist

    var _getCellDelay = function (node, cb) {
        if (node instanceof Gate || node instanceof FlipFlop) {
            _liberty.getCellDelay(node, node.getInputSlew(), node.getOutputCapacitance(), function (err, cell) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, cell);
                } //End of else
            }); //End of getCellDelay
        } else {
            cb(null, node);
        } //End of else
    }; //End of _getCellDelay

    var _constructTimingGraph = function (cb) {
        var nodes = _graph.nodes();
        console.log(nodes);
        async.eachSeries(nodes, function (node, next) {
            if (_graph.node(node) instanceof Gate || _graph.node(node) instanceof FlipFlop) {
                _getCellDelay(_graph.node(node), function (err, cell) {
                    if (err) {
                        next(err);
                    } else {
                        console.log("_getCellDelay()");
                        if (cell instanceof Gate || cell instanceof FlipFlop) {
                            console.log(cell.getDelay());
                        }
                        next(null);
                    } //End of else
                }); //End of _getCellDelay
            } //End of if
        }, cb); //End of async.each
    };//End of  _constructTimingGraph

    var _calculateArrivalTime = function () {
        var preoder = Graphlib.alg.preorder(_graph);
        for (var i = 0; i < preorder.length; i++) {
            var parent = _graph.node(preorder[i]);
            var outEdges = _graph.outEdges(preorder[i]);
            var bits = [];
            var inputDelays;
            if (_graph.node(preorder[i]).direction == "input") {
                bits = parent.bits;
                inputDelays = parent.input_delay;
            }
            for (var j = 0; j < outEdges.length; j++) {
                var child  = _graph.node(outEdges[i]);
                var index = bits.indexOf(_graph.edge(preorder[i], outEdges["w"]));
                if (index > -1) {

                } else {

                } //End of else
            } //End of for j
        } //End of for i
    }; //End of _calculateArrivalTime

    var _calculateRequiredTime = function () {

    };

    var _calculateSlack = function () {

    };

    var _printTimingPaths = function () {

    };

    this.analyze = function () {
        _constructTimingGraph(function () {
            _calculateArrivalTime();
            _calculateRequiredTime()
            _calculateSlack();
            // _calculateHoldViolation();
            // _calculateSetupViolation();
        });
    };

};
