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
  var socketService = require('../services/socket_service'); // TODO move this as global variable
  self.dbConnector.save(self.LogModel, logData, function(err, data) {
    if (err) {
      return callback(err)
    }
    socketService.sendLog(data, logData.id);
    return callback(null, data);
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
