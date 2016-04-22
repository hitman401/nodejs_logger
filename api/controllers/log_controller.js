var logService = require('../services/log_service');

var DEFAULT_LIMIT = 500;
var DEFAULT_OFFSET = 0;

var LogController = function() {};

LogController.prototype.saveLog = function(req, res) {
  var self = this;
  var payload = req.body;
  logService.save(payload, function(err, data) {
    if (err) {
      return res.status(500).send(err);
    }
    res.sendStatus(200);
  });
};

LogController.prototype.getList = function(req, res) {
  var limit = req.query.limit || DEFAULT_LIMIT;
  var offset = req.query.offset || DEFAULT_OFFSET;
  var user = req.params.userId;
  if (isNaN(offset) || isNaN(limit)) {
    return req.sendStatus(400);
  }
  offset = parseInt(offset);
  limit = parseInt(limit);
  if (!user) {
    return req.status(500).send('Property "user" missing');
  }
  logService.list(user, limit, offset, function(err, data) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(data);
  });
};

LogController.prototype.searchLogs = function(req, res) {
  var user = req.params.userId;
  var queryParams = req.query;
  var offset = queryParams.offset;
  var limit = queryParams.limit;
  var conditions = {};
  if (queryParams.level) {
    conditions.level = queryParams.level;
  }
  if (queryParams.date) {
    conditions.date = queryParams.date;
  }
  if (!conditions.level && !conditions.date) {
    conditions.level = conditions.date = '';
    // return res.status(500).send('Filter property missing');
  }
  if (isNaN(offset) || isNaN(limit)) {
    return req.sendStatus(400);
  }
  offset = parseInt(offset);
  limit = parseInt(limit);
  if (!user) {
    return res.status(500).send('Property user missing');
  }
  logService.search(user, conditions, offset, limit, function(err, data) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(data);
  });
};

LogController.prototype.exportData = function(req, res) {
  var logSrcId = req.params.userId;
  logService.export(logSrcId, function(err, data) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(data);
  });
};

LogController.prototype.downloadLogs = function(req, res) {
  res.download(logService.download(req.params.userId));
};

LogController.prototype.clearTemp = function(req, res) {
  logService.clearTempFile(req.params.userId, function(err, data) {
    if (err) {
      return res.status(500).send(err)
    }
    return res.status(200).send('Done');
  });
};

module.exports = new LogController();
