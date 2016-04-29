module.exports.Util =  {
    clone: function (obj) {
        // basic type deep copy
        if (obj === null || obj === undefined || typeof obj !== 'object')  {
            return obj
        } //End of basic deep copy
        // array deep copy
        if (obj instanceof Array) {
            var cloneA = [];
            for (var i = 0; i < obj.length; ++i) {
                cloneA[i] = clone(obj[i]);
            }
            return cloneA;
        } //End of instanceof Array
        // object deep copy
        if (obj instanceof Object) {
            var cloneObj = {};
            for (var i in obj) {
                cloneObj[i] = clone(obj[i]);
            }

            return cloneObj;
        } //End of instanceof Object
    }, //End of clone

    getMaximum: function(arr, firstKey, secondKey) {
        if (arr.length === 0) {
            return -1;
        } //End of getMaximum

        var max = Number(arr[0][firstKey][secondKey]);

        for (var i = 1; i < arr.length; i++) {
            if (Number(arr[i][firstKey][secondKey]) > max) {
                max = Number(arr[i][firstKey][secondKey]);
            } //End of if
        } //End of for

        return max;
    }//End of getMaximum

}; //End of module.exports
