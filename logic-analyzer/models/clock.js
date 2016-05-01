'use strict';

var Util = require('./utility');

module.exports = function (filename) {
    var _clk;

    var _setClk = function (clk) {
        _clk = Util.clone(clk);
    }; //End of _setClk

    fs.readJson(filename, function (err, data) {
        if (err) {
            console.error(err);
            throw Error("An error has occured whule parsing the clock skew file.");
        } else {
            _setClk(data);
        } //End of else
    }); //End of readJson

    this.getClockSkew = function (name) {
        return _clk[name];
    }; //End of getClockSkew

};
