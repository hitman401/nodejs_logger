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

LogService.prototype.prepareModel = function(sessionId) {
  var self = this;
  var modelName = sessionId + LOG_SUFFIX;
  self.LogModel = self.dbConnector.getModel(self.dbConnector.MODEL_TYPES.LOGS, modelName);
  if (!self.LogModel) {
    throw 'Model not found';
  }
};

LogService.prototype.save = function(logData, callback) {
  var self = this;
  var socketService = require('../services/socket_service');
  var lookupService = require('../services/nodeid_lookup_service');
  if (!logData.id) {
    return console.log('ID not found');
  }
  lookupService.find(logData, function(err, log) {
    if (err) {
      return callback(err);
    }
    if (!log) {
      return callback();
    }
    self.prepareModel(log.id);
    self.dbConnector.save(self.LogModel, log, function(err) {
      if (err) {
          console.log('Error while saving log', err);
      }
    });
    socketService.sendLog(log, log.id);
    callback();
  });
};

LogService.prototype.list = function(sessionId, limit, offset, callback) {
  var self = this;
  self.prepareModel(sessionId);
  return self.dbConnector.list(self.LogModel, limit, offset, callback);
};

LogService.prototype.search = function(sessionId, conditions, offset, limit, callback) {
  var self = this;
  var query = {};
  self.prepareModel(sessionId);
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

LogService.prototype.export = function(sessionId, callback) {
  var self = this;
  self.prepareModel(sessionId);
  return self.dbConnector.export(self.LogModel, function(err, data) {
    if (err) {
      return callback(err);
    }
    self.fileLinks[sessionId] = data;
    callback(null, 'Done');
  });
};

LogService.prototype.download = function(sessionId, callback) {
  var self = this;
  return self.fileLinks[sessionId];
};

LogService.prototype.clearTempFile = function(sessionId, callback) {
  var self = this;
  self.dbConnector.clearTempFile(self.fileLinks[sessionId], callback);
};

module.exports = exports = new LogService();
