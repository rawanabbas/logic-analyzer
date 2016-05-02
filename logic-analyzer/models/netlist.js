'use strict';
var fs = require('fs-extra');
var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;

var Util = require('./utility');

var Liberty = require('./liberty');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');
var Clock = require('./clock');
var Constraint = require('./constraint');


module.exports = function (netlist, constraint, capacitance, clk, constraints) {
    console.log('Inside Netlist.');

    function Node(data) {
        this.data = data;
        this.next = [];
    }

    var _netlist;
    var _capacitance;
    var _ports;
    var _cells;
    var _module;
    var _graph = new Graph({directed: true});
    var _liberty = new Liberty();
    var _constraints = new Constraint(constraint);
    var _paths = {};

    var _getConstraints = function (filename) {
        _constraints.parseConstraint(filename);
    }; //End of _getConstraints

    var _setPortProperties = function (port, constraints) {
        // console.log(port);
        _ports[port].instance_name = port;
        if (_isInput(port)) {
            _ports[port].input_delay  = constraints.getInputDelay(port);
            _ports[port].input_slew  = constraints.getInputSlew(port);
        } else {
            _ports[port].capacitance_load = constraints.getInputDelay(port);
        } //End of else
    }; //End of _setPortProperties

    var _setPortPinCapacitance = function (port, capacitance) {
        if(!_isInput(port)) {
            _ports[port].pin_capacitance = capacitance;
        } //End of if
    }; //End of _setPortPinCapacitance

    var _constructGraph = function (i, cb) {
        // console.log('Constructing Graph.....');
        var keys = Object.keys(_cells);
        if (i < keys.length) {
            var connection = _cells[keys[i]]['connections'];
            var connectionKeys = Object.keys(connection);

            _liberty.getCellByName(_cells[keys[i]]['type'], function (err, cell) {
                if (err) {
                    console.error(err);
                    throw Error(err);
                } else {
                    var inputs = cell.getInputPorts();
                    var outputs = cell.getOutputPorts();
                    cell.setInstanceName(keys[i]);
                    for (var j = 0; j < connectionKeys.length; j++) {
                        if (inputs.indexOf(connectionKeys[j]) > -1) {
                            // console.log('----Inputs-----');
                            if (_graph.hasNode(connection[connectionKeys[j]][0])) {
                                _renameGraphNode(connection[connectionKeys[j]][0], keys[i], cell);
                            } else {
                                _graph.setEdge(connection[connectionKeys[j]][0], keys[i], connection[connectionKeys[j]][0]);
                            } //End of else
                            // console.log('----End Inputs----');
                        } else {
                            // console.log('=====Outputs=====');
                            if (_graph.hasNode(connection[connectionKeys[j]][0])) {
                                _renameGraphNode(connection[connectionKeys[j]][0], keys[i], cell);
                            } else {
                                _graph.setEdge(keys[i], connection[connectionKeys[j]][0], connection[connectionKeys[j]][0]);
                            } //End of else
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
            // console.log('Graph Constructed!');
            cb(null, _graph);
        } //End of else
    }; //End of constructGraph

    var _isInput = function (port) {
        return _ports[port].direction == "input";
    };

    var _isClock = function (port) {
        return (_ports[port] == "CLK");
    };

    var _renameGraphNode = function (node, newNode, label) {
        if (node == null || newNode == null) {
            throw Error("renameGraphNode() must contain node and newNode");
        } //End of if
        var nodeEdges = _graph.nodeEdges(node);
        var labels = [];
        // console.log('-=--=-=-=-=-=-= Node Edges =-=-=-=-=-=-=-');
        for (var i = 0; i < nodeEdges.length; i++) {
            // console.log(nodeEdges[i]);
            labels[i] = _graph.edge(nodeEdges[i]);
        }
        // console.log('-=--=-=-=-=-= END Node Edges =-=-=-=-=-=-=-');
        _graph.removeNode(node);
        _graph.setNode(newNode, label);
        for (var i = 0; i < nodeEdges.length; i++) {
            if (nodeEdges[i]["v"] == node) {
                _graph.setEdge(newNode, nodeEdges[i]["w"], labels[i]);
            } else if (nodeEdges[i]["w"] == node) {
                _graph.setEdge(nodeEdges[i]["v"], newNode, labels[i]);
            } //End of else
        } //End of for
    }; //End of renameGraphNode

    var _traverse = function (node) {
        var cell = _graph.node(node);
        var outEdges = _graph.outEdges(node);
        _paths[node] = new Node(cell.instance_name || cell.getInstanceName());
        console.log(cell.instance_name || cell.getInstanceName());

        if (outEdges) {
            for (var i = 0; i < outEdges.length; i++) {
                _paths[node].next.push( _graph.node(outEdges[i]["w"]));
                _traverse(outEdges[i]["w"]);
            } //End of for
            // nodePath.push(outEdges[outEdges.length - 1]["w"]);
        } //End of if
    }; //End of _traverse

    this.parseNetlist = function (netlist, cb) {
        if (netlist == null) {
            throw Error("File is not provided for parsing.");
        }
        fs.readJson(netlist, function (err, data) {
            if (err) {
                console.error("An error has occured while reading the netlist file.");
                cb(err);
            } else {
                _module = Object.keys(data['modules'])[0];
                _ports = data['modules'][_module]['ports'];
                _cells = data['modules'][_module]['cells'];

                var keys = Object.keys(_cells);
                var portKeys = Object.keys(_ports);


                for (var i = 0; i < portKeys.length; i++) {

                    var bits = _ports[portKeys[i]]['bits'];
                    _setPortProperties(portKeys[i], _constraints)
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
                        console.log('-=--=-=-=-=-=-= Traversing =-=-=-=-=-=-=-');
                        var inputs = _graph.sources();
                        var outputs = _graph.sinks();
                        for (var i = 0; i < inputs.length; i++) {
                            _traverse(inputs[i]);
                        }
                        console.log('======================================================');
                        console.log('                    PATHS                             ');
                        console.log('======================================================');
                        console.log(_paths);
                        console.log('======================================================');
                        console.log('                    END PATHS                         ');
                        console.log('======================================================');
                        console.log('-=--=-=-=-=-=-= Traversed =-=-=-=-=-=-=-');
                        cb(null, _graph);
                    } //End of else
                }); //End of _constructGraph
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
                        for (var cell in data[key]) {
                            if (data[key].hasOwnProperty(cell)) {
                                var node = _graph.node(cell);
                                for (var port in data[key][cell]) {
                                    if (data[key][cell].hasOwnProperty(port)) {
                                        var capacitance = data[key][cell][port];
                                        if (node instanceof Gate || node instanceof FlipFlop) {
                                            if (node.getInputPinCapacitance() < capacitance) {
                                                node.setInputPinCapacitance(capacitance);
                                            } //End of if
                                        } else if (cell.indexOf("output") > -1) {
                                            _setPortPinCapacitance(Util.getPortName(cell), capacitance);
                                        } //End of else
                                    } //End of if
                                } //End of for in port
                            } //End of if
                        } //End of for in cell
                    } //End of if
                } //End for in key
                console.log('--------------- END Capacitance File -------------------');
                cb(null, data);
            } //End of else
        }); //End of readJson
    }; //End of parseCapacitanceFile

    this.getTimingPaths = function () {
        return _paths;
    }; //End of getTimingPaths

    if (netlist && capacitance) {
        // _netlist = netlist;
        var Netlist = this;
        this.parseNetlist(netlist, function (err, graph) {
            if (err) {
                console.error(err);
                throw Error(err);
            } else {
                Netlist.parseCapacitanceFile(capacitance, function (err, data) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        console.log('--------- Parsing ----------');
                        console.log(Netlist.getGraph());
                        console.log('--------- Parsed ----------');
                    } //End of else
                }); //End of parseCapacitanceFile
            } //End of else
        }); //End of parseNetlist
    } //End of if

}; //End of module.exports
