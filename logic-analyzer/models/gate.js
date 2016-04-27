
module.exports.Gate = function (cell, inputs, outputs, size, tpd, tcd) {

    var _inputs = [];
    var _outputs = [];
    var _inout = [];
    var _tpd = Number.MIN_VALUE;
    var _tcd = Number.MAX_VALUE;
    var _size = 1;

    if (cell != null) {
        var pins = cell["pins"];
        var keys = Object.keys(pins);
        var direction;
        var port;
        for (var i = 0; i < keys.length; i++) {
            port = pins[keys[i]];
            direction = port["direction"];
            _size = Number(port["size"]);
            if (direction == "input") {
                _inputs.push(port);
            } else if (direction == "output") {
                _outputs.push(port);
            } else {
                _inout.push(port);
            } //End of else
        } //End of for
    } else {
        if (inputs != null) {
            _inputs = inputs;
        }
        if (outputs != null) {
            _outputs = outputs;
        }
        if (tpd != null) {
            _tpd = tpd;
        }
        if (tcd != null) {
            _tcd = tcd;
        }
        if (size != null) {
            _size = size;
        }
    }

    this.getInputs = function () {
        return _inputs;
    }; //End of this.getInputs

    this.getOutputs = function () {
        return _outputs;
    }; //End of this.getOutputs

    this.setInputs = function (inputs) {
        for (var input in inputs) {
            if (inputs.hasOwnProperty(input)) {
                _inputs.push(input);
            } //End of if
        } //End of for in
    }; //End of this.setInputs

    this.setOutputs = function (outputs) {
        for (var output in outputs) {
            if (outputs.hasOwnProperty(output)) {
                _outputs.push(output);
            } //End of if
        } //End of for in
    }; //End of this.setOutputs

    this.getPropagationDelay = function () {
        return _tpd;
    }; //End of this.getPropagationDelay

    this.getContaminationDelay = function () {
        return _tcd;
    }; //End of this.getContaminationDelay

    this.setPropagationDelay = function (pd) {
        _tpd = pd;
    }; //End of this.setPropagationDelay

    this.setContaminationDelay = function (cd) {
        _tcd = cd;
    }; //End of setContaminationDelay

    this.connect = function (gate) {
        
    }; //End of connect

} //End of module.exports
