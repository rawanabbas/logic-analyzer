'use strict';
var express = require('express');
var router = express.Router();

var Graph = require('graphlib').Graph;
var Liberty = require('../models/liberty');
var Gate = require('../models/gate');
var FlipFlop = require('../models/flipflop');
var Netlist = require('../models/netlist');

/* GET home page. */
router.get('/', function(req, res, next) {
    // var liberty = new Liberty();
    // console.log('Inside of /');
    // liberty.getCellByName('DFFPOSX1', function (err, cell) {
    //     if (err) {
    //         res.status(500).json(err);
    //     } else {
    //         liberty.getCellDelay(cell, "1.2", "0.6", function (err, cell) {
    //             if (err) {
    //                 res.status(500).json(err);
    //             } else {
    //                 res.status(200).json({setup: cell.getSetupTime(), hold: cell.getHoldTime(), tcq: cell.getTCQ()});
    //             } //End of else
    //         }); //End of getCellDelay
    //     } //End of else
    // }); //End of getCellByName
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
    var netlist = new Netlist("./uploads/test1.json", "./uploads/test1.cap.json");
    res.status(200).json("Netlist and Capacitance file parsed!");
}); //End of get /

module.exports = router;
