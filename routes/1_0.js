var express = require('express');
var logController = require('../api/controllers/log_controller');

var router = express.Router();

router.get('/',function(req,res){
  res.sendFile('index.html');
});
router.get('/logs/:sessionId', logController.getList);
router.get('/logs/export/:sessionId', logController.exportData);
router.get('/logs/download/:sessionId', logController.downloadLogs);
router.get('/logs/clearTemp/:sessionId', logController.clearTemp);
router.post('/logs', logController.saveLog);
router.get('/logs/search/:sessionId', logController.searchLogs);

module.exports = router;
