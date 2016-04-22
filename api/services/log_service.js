var dao = require('./dao_service');
var LOG_SUFFIX = "_logs";

var LogService = function() {
  this.FILTER_BY = {
    'LEVEL': 'level',
    'DATE': 'date'
  };
  this.LogModel = null;
  this.dbConnector = dao.getDBConnector();
  this.fileLinks = {};
};

LogService.prototype.prepareModel = function(logSrcId) {
  var self = this;
  var modelName = logSrcId + LOG_SUFFIX;
  self.LogModel = self.dbConnector.getModel(self.dbConnector.MODEL_TYPES.LOGS, modelName);
  if (!self.LogModel) {
    throw 'Model not found';
  }
};

LogService.prototype.save = function(logData, callback) {
  var self = this;
  self.prepareModel(logData.id);
  var socketService = require('../services/socket_service');
  var lookupService = require('../services/nodeid_lookup_service');
  lookupService.find(logData, function(err, logs) {
    if (err) {
      return callback(err);
    }
    if (!logs) {
      return callback();
    }
    console.log('Logs', logs);
    for (var i in logs) {
      self.dbConnector.save(self.LogModel, logs, function(err) {
        console.log(err);
      });
    }
    // TOFIX
    socketService.sendLog(logs.pop(), logData.id);
    callback();
  });
};

LogService.prototype.list = function(user, limit, offset, callback) {
  var self = this;
  self.prepareModel(user);
  return self.dbConnector.list(self.LogModel, limit, offset, callback);
};

LogService.prototype.search = function(user, conditions, offset, limit, callback) {
  var self = this;
  var query = {};
  self.prepareModel(user);
  if (conditions.level) {
    conditions.level = conditions.level.toUpperCase();
    query.level = {
      $in: conditions.level.split(',')
    }
  }
  if (conditions.date) {
    query.date = {
      $gte: conditions.date
    }
  }
  return self.dbConnector.search(self.LogModel, query, offset, limit, callback);
};

LogService.prototype.export = function(logSrcId, callback) {
  var self = this;
  self.prepareModel(logSrcId);
  return self.dbConnector.export(self.LogModel, function(err, data) {
    if (err) {
      return callback(err);
    }
    self.fileLinks[logSrcId] = data;
    callback(null, 'Done');
  });
};

LogService.prototype.download = function(logSrcId, callback) {
  var self = this;
  return self.fileLinks[logSrcId];
};

LogService.prototype.clearTempFile = function(logSrcId, callback) {
  var self = this;
  self.dbConnector.clearTempFile(self.fileLinks[logSrcId], callback);
};

module.exports = exports = new LogService();
