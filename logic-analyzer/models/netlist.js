'use strict';
var fs = require('fs-extra');
var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;
var async = require('async');

var Util = require('./utility');

var Liberty = require('./liberty');
var Gate = require('./gate');
var FlipFlop = require('./flipflop');
var Clock = require('./clock');
var Constraint = require('./constraint');


module.exports = function (netlist, constraint, capacitance, clk, cb) {
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
            _ports[port].output_slew  = constraints.getInputSlew(port);
        } else {
            _ports[port].capacitance_load = constraints.getCapacitanceLoads(port);
        } //End of else
    }; //End of _setPortProperties

    var _setPortPinCapacitance = function (port, capacitance) {
        if(!_isInput(port)) {
            _ports[port].capacitance_load += capacitance;
        } //End of if
    }; //End of _setPortPinCapacitance

    var _constructGraph = function (i, cb) {
        // console.log('Constructing Graph.....');
        var keys = Object.keys(_cells);
        if (i < keys.length) {
            var connection = _cells[keys[i]]['connections'];
            var connectionKeys = Object.keys(connection);

            console.log('======================================================');
            console.log('                       CELLS                          ');
            console.log('======================================================');
            _liberty.getCellByName(_cells[keys[i]]['type'], function (err, cell) {
                if (err) {
                    console.error(err);
                    throw Error(err);
                } else {
                    var inputs = cell.getInputPorts();
                    var outputs = cell.getOutputPorts();
                    cell.setInstanceName(keys[i]);
                    for (var j = 0; j < connectionKeys.length; j++) {
                        cell.connect(connectionKeys[j], connection[connectionKeys[j]][0]);
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
                    console.log(cell.getInstanceName());
                    console.log(cell.getConnectedNets());
                    console.log('======================================================');
                    console.log('                       END CELLS                      ');
                    console.log('======================================================');
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
        console.log('Port: ', port);
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

    var _traverse = function () {
        var inputs = _graph.sources();
        for (var i = 0; i < inputs.length; i++) {
            // console.log(inputs[i]);
            _traverseGraph(inputs[i], _paths);
        } //End of for in
    }; //End of _traverse

    var _traverseGraph = function (node, path) {
        var cell = _graph.node(node);
        var outEdges = _graph.outEdges(node);
        path[node] = new Node(cell);
        // console.log(cell.instance_name || cell.getInstanceName());
        if (outEdges) {
            for (var i = 0; i < outEdges.length; i++) {
                path[node].next.push(new Node( _graph.node(outEdges[i]["w"])));
                _traverseGraph(outEdges[i]["w"], path);
            } //End of for
            // nodePath.push(outEdges[outEdges.length - 1]["w"]);
        } //End of if
    }; //End of _traverse

    var _setNetCapacitances = function (data) {
        console.log('Inside _setNetCapacitances()');
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                for (var cell in data[key]) {
                    if (data[key].hasOwnProperty(cell)) {
                        var node = _graph.node(cell);
                        for (var port in data[key][cell]) {
                            if (data[key][cell].hasOwnProperty(port)) {
                                var capacitance = data[key][cell][port];
                                if (node instanceof Gate || node instanceof FlipFlop) {
                                    node.setInputPinCapacitance(port, capacitance);
                                } else if (cell.indexOf("output") > -1) {
                                    _setPortPinCapacitance(Util.getPortName(cell), capacitance);
                                } //End of else
                            } //End of if
                        } //End of for in port
                    } //End of if
                } //End of for in cell
            } //End of if
        } //End for in key
        console.log('Finish _setNetCapacitances()');
    }; //End of _setNetCapacitances

    var _backTraverse = function (path) {
        var outputs = _graph.sinks();
        for (var i = 0; i < outputs.length; i++) {
            _backTraverseGraph(outputs[i], path);
        } //End of for in
    }; //End of _backTraverse

    var _backTraverseGraph = function (node, path) {
        console.log('Back Traversing');
        var cell = _graph.node(node);
        var inEdges = _graph.inEdges(node);
        // path[node] = new Node(cell.instance_name || cell.getInstanceName());
        console.log(node);
        if (inEdges) {
            for (var i = 0; i < inEdges.length; i++) {
                path[node].next.push( _graph.node(inEdges[i]["v"]));
                _backTraverseGraph(inEdges[i]["v"], path);
            } //End of for
        } //End of if
    }; //End of _backTraverseGraph

    var _capacitanceGraph = function (node, child) {
        console.log('Inside _capacitanceGraph');
        console.log('Node: ');
        console.log(node);
        var cell = _graph.node(node);
        var childCell = _graph.node(child);
        var inEdges = _graph.inEdges(node);
        console.log("Child");
        console.log(child);
        // path[node] = new Node(cell.instance_name || cell.getInstanceName());
        if ((childCell instanceof Gate || childCell instanceof FlipFlop) && (cell instanceof Gate || cell instanceof FlipFlop)) {
            console.log(cell.getInstanceName(), ' Output capacitance: ', cell.getOutputCapacitance());
            console.log(cell.getInstanceName(), ' connected to ', childCell.getInstanceName(), 'via ', _graph.edge(node, child));
            console.log(childCell.getInstanceName(), ' Input Capacitance: ', childCell.getInputPinCapacitance(childCell.getConnectedNets(_graph.edge(node, child))));
            cell.setOutputCapacitance(cell.getOutputCapacitance() + childCell.getInputPinCapacitance(childCell.getConnectedNets(_graph.edge(node, child))));
            console.log(cell.getInstanceName(), " Capacitance: ", cell.getOutputCapacitance());
        } else if (cell instanceof Gate || cell instanceof FlipFlop) {
            console.log('Else if childCell.');
            cell.setOutputCapacitance(childCell.capacitance_load);
        }
        console.log('=============================');
        console.log('         inEdges             ');
        console.log('=============================');
        console.log(inEdges);
        console.log('=============================');
        console.log('         END inEdges         ');
        console.log('=============================');
        if (inEdges) {
            for (var i = 0; i < inEdges.length; i++) {
                _capacitanceGraph(inEdges[i]["v"], node);
            } //End of for
        } //End of if
    }; //End of _capacitanceGraph

    var _setCapacitances = function () {
        console.log('Inside _setCapacitances()');
        var outputs = _graph.sinks();
        for (var i = 0; i < outputs.length; i++) {
            _capacitanceGraph(outputs[i]);
            // _backTraverseGraph(outputs[i]);
        } //End of for
    }; //End of _setCapacitances


    var _getOutputSlew = function (cell, inputSlew, capacitance, cb) {
        console.log('_getOutputSlew()');
        if (cell instanceof Gate || cell instanceof FlipFlop) {
            _liberty.getCellOutputSlew(cell, inputSlew, capacitance, function (err, gate) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, gate);
                } //End of else
            }); //End of getOutputSlew
        } else {
            cb(null, cell);
        }
    };

    var _getInputSlew = function (cell, parentOutputSlew, cb) {
        console.log('_getInputSlew()');
        if (cell instanceof Gate || cell instanceof FlipFlop) {
            if (cell.getInputSlew() < parentOutputSlew) {
                cell.setInputSlew(parentOutputSlew);
            }
            cb(null, cell);
        } else {
            cb(null, cell);
        }
    }; //End of _getInputSlew

    var _setSlews = function (node, cb) {
        var preorder = Graphlib.alg.preorder(_graph, node);
        console.log(preorder);
        async.eachSeries(preorder, function (cell, callback) {
            var outEdges = _graph.outEdges(cell);
            var node = _graph.node(cell);
            var outputSlew;
            if (node instanceof Gate || node instanceof FlipFlop) {
                outputSlew = node.getOutputSlew().max;
            } else {
                outputSlew = node.output_slew;
            }
            async.each(outEdges, function (edge, next) {
                _getInputSlew(_graph.node(edge["w"]), outputSlew,  function (err, data) {
                    if (err) {
                        next(err);
                    } else {
                        var inputSlew, capacitance;
                        if (data instanceof Gate || data instanceof FlipFlop) {
                            inputSlew = data.getInputSlew();
                            capacitance = data.getOutputCapacitance();
                        } else {
                            inputSlew = data.input_slew;
                            capacitance = data.capacitance_load;
                        }
                        _getOutputSlew(data, inputSlew, capacitance, next);
                    } //End of else
                }); //End of _getInputSlew
            }, callback);
        }, cb);
    }; //End of _setSlews

    var _modifiyGraph = function (cb) {
        _setCapacitances();
        var inputs = _graph.sources();
        _setSlews(inputs[0], cb);
    }; //End of _modifiyGraph

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
                        _traverse();
                        console.log('-=--=-=-=-=-=-= Traversed =-=-=-=-=-=-=-');
                        console.log('======================================================');
                        console.log('                    PATHS                             ');
                        console.log('======================================================');
                        console.log(_paths);
                        console.log('======================================================');
                        console.log('                    END PATHS                         ');
                        console.log('======================================================');
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
                console.log('---------------- NET Capacitance File ------------------');
                _setNetCapacitances(data);
                console.log('------------- END NET Capacitance File -----------------');
                console.log('--------------- END Capacitance File -------------------');
                cb(null, data);
            } //End of else
        }); //End of readJson
    }; //End of parseCapacitanceFile

    this.getTimingPaths = function () {
        return _paths;
    }; //End of getTimingPaths

    if (netlist && capacitance) {
        var Netlist = this;
        this.parseNetlist(netlist, function (err, graph) {
            if (err) {
                console.error(err);
                cb(err);
            } else {
                Netlist.parseCapacitanceFile(capacitance, function (err, data) {
                    if (err) {
                        console.error(err);
                        cb(err);
                    } else {
                        _modifiyGraph(function (err) {
                            if (err) {
                                cb(err);
                            } else {
                                var nodes = _graph.nodes();
                                console.log('************************ Timing Graph Slew ***********************************');
                                for (var i = 0; i < nodes.length; i++) {
                                    var cell = _graph.node(nodes[i])
                                    if (cell instanceof Gate || cell instanceof FlipFlop) {
                                        console.log(cell.getInstanceName());
                                        console.log(cell.getInputSlew());
                                        console.log(cell.getOutputSlew());
                                    }
                                }
                                console.log('********************** END Timing Graph Slew *******************************');
                                cb(null, _graph);
                            }
                        }); //End of _modifiyGraph
                    }
                }); //End of else
            } //End of parseCapacitanceFile
        }); //End of else
    } //End of parseNetlist
    // } //End of if

}; //End of module.exports
