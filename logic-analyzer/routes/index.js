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
    res.render('index', { title: 'Logic Analyzer', error: req.flash('error') });
}); //End of get /

module.exports = router;
