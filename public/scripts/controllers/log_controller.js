var logService = require('../services/log_service');

var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;

var LogController = function() {};

LogController.prototype.saveLog = function(req, res) {
  var payload = req.body;
  logService.save(payload, function(err, data) {
    if (err) {
      return req.status(500).send(err);
    }
    res.status(200).send(data);
  });
};

LogController.prototype.getList = function(req, res) {
  var limit = req.query.limit || DEFAULT_LIMIT;
  var offset = req.query.offset || DEFAULT_OFFSET;
  logService.list(limit, offset, function(err, data) {
    if (err) {
      return res.status(500).send(data);
    }
    return res.status(200).send(data);
  });
};

LogController.prototype.searchLogs = function(req, res) {
  var conditions = req.body;
  var limit = req.query.limit || DEFAULT_LIMIT;
  logService.search(conditions, limit, function(err, data) {
    if (err) {
      return res.status(500).send(data);
    }
    return res.status(200).send(data);
  });
};

module.exports = new LogController();
