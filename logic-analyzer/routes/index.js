'use strict';
var express = require('express');
var router = express.Router();

// var Graph = require('graphlib').Graph;
var Liberty = require('../models/liberty');
var Gate = require('../models/gate');
var FlipFlop = require('../models/flipflop');
var Netlist = require('../models/netlist');

/* GET home page. */
router.get('/', function(req, res, next) {
    var liberty = new Liberty();
    console.log('Inside of /');
    liberty.getCellByName('DFFPOSX1', function (err, cell) {
        if (err) {
            res.status(500).json(err);
        } else {
            liberty.getCellDelay(cell, "1.2", "0.6", function (err, cell) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(200).json({setup: cell.getSetupTime(), hold: cell.getHoldTime(), tcq: cell.getTCQ()});
                } //End of else
            }); //End of getCellDelay
        } //End of else
    }); //End of getCellByName
}); //End of get /

module.exports = router;
