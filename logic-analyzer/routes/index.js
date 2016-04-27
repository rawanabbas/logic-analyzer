var express = require('express');
var router = express.Router();
var Liberty = require('../models/liberty').Liberty;
/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  console.log('Inside /');
  var liberty = new Liberty('./uploads/osu350.json');
  liberty.parseLibertyFile(function (err) {
      if (err) {
          res.status(500).json(err);
      }
      liberty.getCellByName('AND', '2', '1', '1', function (err, cell) {
          if (err) {
              res.status(500).json(err);
          } else {
              res.status(200).json(cell);
          } //End of else
      }); //End of getCellByName
  }); //End of parseLibertyFile
}); //End of get /

module.exports = router;
