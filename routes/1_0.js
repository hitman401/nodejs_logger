var express = require('express');
var logController = require('../api/controllers/log_controller');

var router = express.Router();

router.get('/',function(req,res){
  res.sendFile('index.html');
});
router.get('/logs/:userId', logController.getList);
router.post('/logs', logController.saveLog);
router.get('/logs/search/:userId', logController.searchLogs);

module.exports = router;
