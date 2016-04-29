'use strict';
var express = require('express');
var router = express.Router();

// var Graph = require('graphlib').Graph;
// var Liberty = require('../models/liberty').Liberty;
var Netlist = require('../models/netlist').Netlist;

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('Insise Get /');
    var netlist = new Netlist('./uploads/test1.json');
    var graph = netlist.getGraph();
    if (graph) {
        res.status(200).json(graph);
    } else {
        res.status(500).json("something went wrong. :(")
    }
    // res.render('index', { title: 'Express' });
    // console.log('Inside /');
    // var graph = new Graph({directed: true});
    // graph.setNode("a", "a-value");
    // graph.setNode("b", "b-value");
    // graph.setEdge("a", "dummy", "Dummy Value");
    // graph.setEdge("dummy", "b", "Another B Dummy Value");
    // // console.log(graph.node("dummy"));
    // if (graph.hasNode("dummy")) {
    //     console.log('------Dummy Edges------');
    //     var nodeEgdes = graph.nodeEdges("dummy");
    //     graph.removeNode("dummy");
    //     graph.setNode("c", "c-value");
    //     for (var i = 0; i < nodeEgdes.length; i++) {
    //         if (nodeEgdes[i]["v"] == "dummy") {
    //             graph.setEdge("c", nodeEgdes[i]["w"]);
    //         } else if (nodeEgdes[i]["w"] == "dummy") {
    //             graph.setEdge(nodeEgdes[i]["v"], "c");
    //         }
    //     }
    // }
    // res.status(200).json(graph.edges());
    // var liberty = new Liberty('./uploads/osu350.json');
    // liberty.parseLibertyFile(function (err) {
    //     if (err) {
    //         res.status(500).json(err);
    //     }
    //     liberty.getCellByName('DFFSR', function (err, cell) {
    //         if (err) {
    //             res.status(500).json(err);
    //         } else {
    //             res.status(200).json(cell);
    //         } //End of else
    //     }); //End of getCellByName
    // }); //End of parseLibertyFile
}); //End of get /

module.exports = router;
