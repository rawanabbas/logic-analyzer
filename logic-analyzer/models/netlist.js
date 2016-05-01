'use strict';
var fs = require('fs-extra');
var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;

var Util = require('./utility');

var Liberty = require('./liberty');
var Gate = require('./gate');


module.exports = function (netlist, capacitance, clk, constraints) {
    console.log('Inside Netlist.');

    var _netlist;
    var _capacitance;
    var _ports;
    var _cells;
    var _module;
    var _graph = new Graph({directed: true});
    var liberty = new Liberty();

    var _renameGraphNode = function (node, newNode, label) {
        if (node == null || newNode == null) {
            throw Error("renameGraphNode() must contain node and newNode");
        } //End of if
        var nodeEgdes = _graph.nodeEdges(node);
        _graph.removeNode(node);
        _graph.setNode(newNode, label);
        for (var i = 0; i < nodeEgdes.length; i++) {
            if (nodeEgdes[i]["v"] == node) {
                _graph.setEdge(newNode, nodeEgdes[i]["w"]);
            } else if (nodeEgdes[i]["w"] == node) {
                _graph.setEdge(nodeEgdes[i]["v"], newNode);
            } //End of else
        } //End of for
    }; //End of renameGraphNode

    var _constructGraph = function (i, cb) {
        var keys = Object.keys(_cells);
        if (i < keys.length) {
            var connection = _cells[keys[i]]['connections'];
            var connectionKeys = Object.keys(connection);

            liberty.getCellByName(_cells[keys[i]]['type'], function (err, cell) {
                if (err) {
                    console.error(err);
                    throw Error(err);
                } else {
                    var inputs = cell.getInputPorts();
                    var outputs = cell.getOutputPorts();

                    for (var j = 0; j < connectionKeys.length; j++) {
                        console.log('***********Connection Keys**************');
                        console.log(connectionKeys[j]);
                        console.log('**********End Connection Keys***********');
                        if (inputs.indexOf(connectionKeys[j]) > -1) {
                            console.log('----Inputs-----');
                            if (_graph.hasNode(connection[connectionKeys[j]][0])) {
                                _renameGraphNode(connection[connectionKeys[j]][0], keys[i], cell);
                            } else {
                                _graph.setEdge(connection[connectionKeys[j]][0], keys[i], connection[connectionKeys[j]][0]);
                            } //End of else
                            console.log('----End Inputs----');
                        } else {
                            console.log('=====Outputs=====');
                            if (_graph.hasNode(connection[connectionKeys[j]][0])) {
                                _renameGraphNode(connection[connectionKeys[j]][0], keys[i], cell);
                            } else {
                                _graph.setEdge(keys[i], connection[connectionKeys[j]][0], connection[connectionKeys[j]][0]);
                            } //End of else
                            console.log('=====End Outputs=====');
                        } //End of else
                    } //End of for j
                } //End of else
                _constructGraph(i + 1, cb);
            }); //End of getCellByName
        } else {
            console.log('---------Graph Edges----------');
            console.log(_graph.edges());
            console.log('-------End Graph Edges--------');
            console.log('---------Graph Nodes----------');
            console.log(_graph.nodes());
            console.log('-------End Graph Nodes--------');
            cb(null, _graph);
        } //End of else
    }; //End of constructGraph

    this.parseNetlist = function (netlist, cb) {
        if (netlist == null) {
            throw Error("File is not provided for parsing.");
        }
        fs.readJson(_netlist, function (err, data) {
            if (err) {
                console.error("An error has occured while reading the liberty file.");
                cb(err);
            } else {
                _module = Object.keys(data['modules'])[0];
                _ports = data['modules'][_module]['ports'];
                _cells = data['modules'][_module]['cells'];

                var keys = Object.keys(_cells);
                var portKeys = Object.keys(_ports);


                for (var i = 0; i < portKeys.length; i++) {

                    var bits = _ports[portKeys[i]]['bits'];
                    _graph.setNode(portKeys[i], _ports[portKeys[i]]);

                    if (_ports[portKeys[i]]['direction'] == 'input') {
                        for (var j = 0; j < bits.length; j++) {
                            _graph.setEdge(portKeys[i], bits[j], bits[j]);
                        } //End of for j
                    } else {
                        for (var j = 0; j < bits.length; j++) {
                            _graph.setEdge(bits[j], portKeys[i], bits[j]);
                        } //End of for j
                    } //End of else
                } //End of for portKeys
                _constructGraph(0, function (err, graph) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, _graph);
                    }
                });
            } //End of else
        });//End of readJson
    }; //End of parseNetlist

    this.getGraph = function () {
        return Graphlib.json.write(_graph);
    }; //End fo getGraph

    this.parseCapacitanceFile = function (capacitance, cb) {
        console.log('------------------ Capacitance File --------------------');
        fs.readJson(capacitance, function (err, data) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        // TODO: 
                    } //End of if
                } //End for in
                console.log('--------------- END Capacitance File -------------------');
                cb(null, data);
            } //End of else
        }); //End of readJson
    }; //End of parseCapacitanceFile

    if (netlist != null && capacitance != null) {
        _netlist = netlist;
        var Netlist = this;
        Netlist.parseNetlist(_netlist, function (err, graph) {
            if (err) {
                console.error(err);
                throw Error(err);
            } else {
                Netlist.parseCapacitanceFile(capacitance, function (err) {
                    if (err) {
                        console.error(err);
                        throw Error(err);
                    } //End of if err
                }); //End of parseCapacitanceFile
            } //End of else
        }); //End of parseNetlist
    } //End of if
}; //End of module.exports
