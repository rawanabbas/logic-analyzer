'use strict';
module.exports =  {
    clone: function (obj) {
        // basic type deep copy
        if (obj === null || obj === undefined || typeof obj !== 'object')  {
            return obj
        } //End of basic deep copy
        // array deep copy
        if (obj instanceof Array) {
            var cloneA = [];
            for (var i = 0; i < obj.length; ++i) {
                cloneA[i] = this.clone(obj[i]);
            }
            return cloneA;
        } //End of instanceof Array
        // object deep copy
        if (obj instanceof Object) {
            var cloneObj = {};
            for (var i in obj) {
                cloneObj[i] = this.clone(obj[i]);
            }

            return cloneObj;
        } //End of instanceof Object
    }, //End of clone

    getMaximum: function(arr, firstKey, secondKey) {
        if (arr.length === 0) {
            return -1;
        } //End of if

        if (arr[0] instanceof Object) {
            var max = Number(arr[0][firstKey][secondKey]);

            for (var i = 1; i < arr.length; i++) {
                if (Number(arr[i][firstKey][secondKey]) > max) {
                    max = Number(arr[i][firstKey][secondKey]);
                } //End of if
            } //End of for
            return max;
        } //End of if

        if (arr instanceof Array) {
            var max = Number(arr[0]);

            for (var i = 1; i < arr.length; i++) {
                if (Number(arr[i]) > max) {
                    max = Number(arr[i]);
                } //End of if
            } //End of for
            return max;
        } //End of if
    }, //End of getMaximum

    getMinimum: function (arr, firstKey, secondKey) {
        if (arr.length === 0) {
            return -1;
        } //End of if

        if (arr[0] instanceof Object) {
            var min = Number(arr[0][firstKey][secondKey]);

            for (var i = 1; i < arr.length; i++) {
                if (Number(arr[i][firstKey][secondKey]) < min) {
                    min = Number(arr[i][firstKey][secondKey]);
                } //End of if
            } //End of for
            return min;
        } //End of if

        if (arr instanceof Array) {
            var min = Number(arr[0]);

            for (var i = 1; i < arr.length; i++) {
                if (Number(arr[i]) < min) {
                    min = Number(arr[i]);
                } //End of if
            } //End of for
            return min;
        } //End of if
    }, //End fo getMinimum

    getPortName: function (port) {
        var re = /___\w+_([a-zA-Z0-9]+)(\[?\d?\]?)/gmi;
        var m;
        while ((m = re.exec(port)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            return m[1];
        } //End of while
    }, //End of _isPort

    getPortPin: function (port) {
        var re = /___\w+_([a-zA-Z0-9]+)(\[?\d?\]?)/gmi;
        var m;
        while ((m = re.exec(port)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            return m[2];
        } //End of while
    }

}; //End of module.exports
