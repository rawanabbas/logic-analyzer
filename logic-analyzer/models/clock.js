'use strict';

var fs = require('fs-extra');
var Util = require('./utility');

module.exports = function (filename) {
    var _clkSkew;
    var _clk;

    var _setClkSkew = function (clk) {
        _clkSkew = Util.clone(clk);
    }; //End of _setClk

    fs.readJson(filename, function (err, data) {
        if (err) {
            console.error(err);
            throw Error("An error has occured whule parsing the clock skew file.");
        } else {
            _setClkSkew(data);
        } //End of else
    }); //End of readJson

    this.getClockSkew = function (name) {
        return _clkSkew[name];
    }; //End of getClockSkew

    this.getClockPeriod = function () {
        return _clk;
    }; //End of getClockPeriod

    this.setClockPeriod = function (clk) {
        _clk = clk;
    }; //End of setClockPeriod

};
