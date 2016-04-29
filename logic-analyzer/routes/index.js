'use strict';
var express = require('express');
var router = express.Router();

// var Graph = require('graphlib').Graph;
var Liberty = require('../models/liberty').Liberty;
var Gate = require('../models/gate').Gate;
var Netlist = require('../models/netlist').Netlist;

/* GET home page. */
router.get('/', function(req, res, next) {
    var liberty = new Liberty();
    console.log('Inside of /');
    liberty.getCellByName('AND2X1', function (err, cell) {
        if (err) {
            res.status(500).json(err);
        } else {
            liberty.getCellDelay(cell, "0.08", "0.42", function (err, cell) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    
                    res.status(200).json({tpd: cell.getPropagationDelay(), tcd: cell.getContaminationDelay()});
                } //End of else
            }); //End of getCellDelay
        } //End of else
    }); //End of getCellByName
}); //End of get /

module.exports = router;
