'use strict';
var express = require('express');
var router = express.Router();
var fs        = require('fs-extra');
var path      = require('path');

var Graphlib = require('graphlib');
var Graph = Graphlib.Graph;
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

    var analyser = new Analyser(netlistPath, constraintPath, capacitancePath, clkPath);
    var analysis = analyser;

    analyser.cb = function (err) {
        if (err) {
            res.status(500).json(err);
        } else {
            analysis.generateTimingReport(function (report) {
                unlinkAll();
                analysis.analyze(function (_graph, setup, hold) {
                    var aat = {};
                    var rat = {};
                    var types = {};
                    for (var source in report) {
                        if (report.hasOwnProperty(source)) {
                            aat[source] = [];
                            rat[source] = [];
                            types[source] = [];
                            for (var i = 0; i < report[source].length; i++) {
                                var a = [];
                                var r = [];
                                var s = [];
                                for (var j = 0; j < report[source][i].length; j++) {
                                    var node = _graph.node(report[source][i][j]);
                                    if (node instanceof Gate || node instanceof FlipFlop) {
                                        a.push(node.getAAT());
                                        r.push(node.getRAT());
                                        s.push(node.getType());
                                    } else {
                                        a.push(node.aat);
                                        r.push(node.rat);
                                        s.push(node.direction);
                                    }
                                } //End of for j
                                aat[source].push(a);
                                rat[source].push(r);
                                types[source].push(s);
                            } //End of for i
                        } //End of if
                    } //End of for in
                    res.render('report', {report: report, aat: aat, rat: rat, types: types, setup: setup, hold: hold});
                }); //End of analyze
            }); //End of generateTimingReport
        } //End of else
    } //End fo analyser.cb

}); //End of post /
module.exports = router;
