'use strict';
var express = require('express');
var router = express.Router();
var fs        = require('fs-extra');
var path      = require('path');

var Graph = require('graphlib').Graph;
var Liberty = require('../models/liberty');
var Gate = require('../models/gate');
var FlipFlop = require('../models/flipflop');
var Netlist = require('../models/netlist');
var Analyser = require('../models/analyser');

/* GET home page. */
router.get('/', function(req, res, cb) {
    res.render('index', { title: 'Logic Analyzer', error: req.flash('error') });
}); //End of get /

router.post('/', function (req, res, cb) {
    var unlinkAll = function () {
        console.log(netlistPath);
        fs.unlink(netlistPath);
        fs.unlink(capacitancePath);
        fs.unlink(constraintPath);
        fs.unlink(clkPath);
    };
    console.log(req.files);
    if (!req.files.netlist || !req.files.capacitance || !req.files.constraint || !req.files.clk) {
        req.flash('error', 'Verilog Files are missing!');
        return res.render('index', {title: 'Logic Analyzer', message: req.flash('error')});
    }

    var netlistPath = req.files.netlist.path;
    var capacitancePath = req.files.capacitance.path;
    var constraintPath = req.files.constraint.path;
    var clkPath = req.files.clk.path;

    var netlist = new Netlist(netlistPath, constraintPath, capacitancePath, clkPath, function (err, graph) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            unlinkAll();
        } else {
            var json = {};
            var nodes = graph.nodes();
            for (var i = 0; i < nodes.length; i++) {
                if (graph.node(nodes[i]) instanceof Gate || graph.node(nodes[i]) instanceof FlipFlop) {
                    json[nodes[i]] = {input_slew: graph.node(nodes[i]).getInputSlew(), output_slew: graph.node(nodes[i]).getOutputSlew()};
                    if (graph.node(nodes[i]) instanceof FlipFlop) {
                        json[nodes[i]].clock_slew  = graph.node(nodes[i]).getClockSlew();
                    } //End of if
                } //End of if
            } //End of for
            unlinkAll();
            res.status(200).json(json);
        } //End of else
    }); //End of netlist

}); //End of post /
module.exports = router;
