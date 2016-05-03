'use strict';

var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;
var async = require('async');

var Util = require('./utility');
var Liberty = require('./liberty');
var Netlist = require('./netlist');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');

module.exports = function (netlist, constraint, capacitance, clk) {

    var _graph;
    var _liberty;

    var _netlist = new Netlist(netlist, constraint, capacitance, function (err, graph) {
        if (err) {
            console.error(err);
            throw Error(err);
        } else {
            _graph = Util.clone(graph);
        } // End of else
    }); // End of new Netlist

    var _getCellDelay = function (node, cb) {
        var cell = _graph.node(node);
        _liberty.getCellDelay(cell, cell.getInputSlew(), cell.getCapacitanceLoads(), function (err, cell) {
            if (err) {
                cb(err);
            } else {
                cb(null, cell);
            } //End of else
        }); //End of getCellDelay
    };

    var _constructTimingGraph = function (cb) {
        var nodes = _graph.nodes();
        async.eachSeries(nodes, function (node, next) {
            _getCellDelay(node, next);
        }, cb); //End of asyn.each
    };//End of  _constructTimingGraph

    var _calculateArrivalTime = function () {
        timing = _netlist.getTimingPaths();
        paths = [];
        for (var port in timing) {
            if (timing.hasOwnProperty(port)) {
                paths.push(timing[port].data);

                paths.push('END');
            } //End of if
        } //End of for in
    }; //End of _calculateArrivalTime

    var _calculateRequiredTime = function () {

    };

    var _calculateSlack = function () {

    };

    this.analyze = function () {
        _constructTimingGraph();
        _calculateArrivalTime();
        _calculateRequiredTime()
        _calculateSlack();
        _calculateHoldViolation();
        _calculateSetupViolation();
    };

};
