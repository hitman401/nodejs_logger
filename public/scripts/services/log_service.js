var dao = require('./dao_service');

var LogService = function() {
  this.FILTER_BY = {
    'LEVEL': 'level',
    'DATE': 'date'
  };
  this.dbConnector = dao.getDBConnector();
  this.LogModel = this.dbConnector.getModel(this.dbConnector.MODELS.LOGS);
  if (!this.LogModel) {
    throw 'Model not found';
  }
};

LogService.prototype.save = function(payload, callback) {
  var self = this;
  self.dbConnector.save(self.LogModel, payload, function(err) {
    if (err) {
      return callback(err)
    }
    return callback(null, 'Saved');
  });
};

LogService.prototype.list = function(limit, offset, callback) {
  var self = this;
  return self.dbConnector.list(self.LogModel, limit, offset, callback);
};

LogService.prototype.search = function(conditions, limit, callback) {
  var self = this;
  var query = {};

  if (!conditions.filterBy) {
    return callback('Missing filterBy property');
  }
  
  if (conditions.filterBy === self.FILTER_BY.LEVEL) {
    if (!conditions.levels) {
      return callback('Missing levels property');
    }
    if (typeof conditions.levels !== 'object') {
      return callback('Property levels must be an array');
    }
    query.level = {$in: conditions.levels};
  }

  if (conditions.filterBy === self.FILTER_BY.DATE) {
    if (!conditions.startDate) {
      return callback('Missing startDate property');
    }
    try {
      var startDate = new Date(conditions.startDate);
      conditions.startDate = startDate.toISOString();
    } catch (e) {
      return callback(e);
    }
    query.date = {$gte: conditions.startDate};
  }

  return self.dbConnector.search(self.LogModel, query, limit, callback);
};

module.exports = exports = new LogService();
