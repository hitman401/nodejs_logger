var express = require('express');
var logController = require('../api/controllers/log_controller');

var router = express.Router();

router.get('/logs/:userId', logController.getList);
router.post('/logs/:userId', logController.saveLog);
router.get('/logs/search/:userId', logController.searchLogs);

module.exports = router;
