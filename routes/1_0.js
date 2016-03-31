var express = require('express');
var logController = require('../public/scripts/controllers/log_controller');

var router = express.Router();

router.get('/log', logController.getList);
router.post('/log', logController.saveLog);
router.get('/log/search', logController.searchLogs);

module.exports = router;
