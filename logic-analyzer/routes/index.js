'use strict';
var express = require('express');
var router = express.Router();

var Graph = require('graphlib').Graph;
var Liberty = require('../models/liberty');
var Gate = require('../models/gate');
var FlipFlop = require('../models/flipflop');
var Netlist = require('../models/netlist');
var Analyser = require('../models/analyser');

/* GET home page. */
router.get('/', function(req, res, next) {
    //     var liberty = new Liberty();
    //     console.log('Inside of /');
    //     liberty.getCellByName('AND2X1', function (err, cell) {
    //         if (err) {
    //             res.status(500).json(err);
    //         } else {
    //             liberty.getCellDelay(cell, "1.2", "0.4", function (err, cell) {
    //                 if (err) {
    //                     res.status(500).json(err);
    //                 } else {
    //                     res.status(200).json(cell.getDelay());
    //                 } //End of else
    //             }); //End of getCellDelay
    //         } //End of else
    //     }); //End of getCellByName
    // console.log('Inside Get /');
    // var graph = new Graph({directed: true, multigraph: false});
    // graph.setNode("a", "a-value");
    // graph.setNode("b", "b-value");
    // console.log('Nodes set.');
    // graph.setEdge("a", "b", "ab-value");
    // console.log('First Edge Set.');
    // console.log(graph.edge({v: "a", w: "b"}));
    // graph.setEdge("a", "b", "new ab-value");
    // console.log(graph.edge({v: "a", w: "b"}));
    // res.status(200).json(graph.edges());
    // var netlist = new Netlist("./uploads/test1.json", "./uploads/test1.cap.json");
    // res.status(200).json("Netlist and Capacitance file parsed!");
    // console.log('Insise Get /');
    // var netlist = new Netlist('./uploads/test1.json', './uploads/test1.const.json', './uploads/test1.cap.json', './uploads/test1.clk.json', function (err, _graph) {
    //     if (err) {
    //         res.status(500).json(err);
    //     } else {
    //         var nodes = _graph.nodes();
    //         console.log(nodes);
    //         var json = {};
    //         for (var i = 0; i < nodes.length; i++) {
    //             var node = _graph.nodes(nodes[i]);
    //             if (node instanceof Gate || node instanceof FlipFlop) {
    //                 console.log(node);
    //                 json[node] = {input_slew: node.getInputSlew(), output_slew: node.getOutputSlew().max, capacitance: node.getOutputCapacitance}
    //             } else {
    //                 json[node] = node;
    //             }
    //         }
    //         res.status(200).json(json);
    //     } //End of else
    // });
    // var graph = netlist.getGraph();
    // if (graph) {
    //     res.status(200).json(graph);
    // } else {
    //     res.status(500).json("something went wrong. :(")
    // } //End  of else
    // res.status(200).send("DONE!!")
    var analyser = new Analyser('./uploads/test1.json', './uploads/test1.const.json', './uploads/test1.cap.json', './uploads/test1.clk.json', function (err) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json("DONE!")
        }
    });
}); //End of get /

module.exports = router;
