var dao = require('./dao_service');
var LOG_SUFFIX = "_logs";

var LogService = function() {
  this.FILTER_BY = {
    'LEVEL': 'level',
    'DATE': 'date'
  };
  this.LogModel = null;
  this.dbConnector = dao.getDBConnector();
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

LogService.prototype.search = function(user, conditions, limit, callback) {
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
  return self.dbConnector.search(self.LogModel, query, limit, callback);
};

module.exports = exports = new LogService();
