var LookUpService = function() {
  this.daoService = require('./dao_service');
  this.nodeIdLookup = self.dbConnector.getModel(self.daoService.getDBConnector().MODEL_TYPES.LOOKUP);
  this.tempLog = self.dbConnector.getModel(self.daoService.getDBConnector().MODEL_TYPES.TEMPLOG);
  this.memStore = {}
};

LookUpService.prototype.find = function(logData, callback) {
  if (memStore[logData.id]) {
    memStore[logData.id].push(logData);
    return callback();
  }
  var self = this;

  var readTempLogs = function(logId, offset, limit, callback) {
    self.tempLog.find({log_id: logId}).skip(offset).limit(limit).exec(callback);
  };

  var deleteTempLogs = function(tempLogs) {
    for (var i in tempLogs) {
      self.tempLog.findByIdAndRemove(tempLogs[i]._id, function() { });
    }
  };

  var getNodeId = function(logId, callback) {
    self.nodeIdLookup.find({log_id: logId}).exec(callback);
  };

  var updateNodeId = function(nodeId, logId, callback) {
    self.nodeIdLookup.findOneAndUpdate({node_id: nodeId}, {node_id: nodeId, log_id: logId}, callback);
    memStore[logId] = [];
  };

  var grepNodeID = function(msg) {
    return null;
  };

  var saveToTempLog = function() {
    var data = {log_id: logData.id, log: logData};
    self.daoService.getDBConnector().save(self.tempLog, data, function(err) {
      callback(err);
    });
  };

  var updateNodeIdAndClearTempLogs = function(nodeId) {
    var logs = [];
    var onNodeIdUpdated = function(err) {
      if (err) {
        return callback(err);
      }
      var offset = 0;
      var limit = 1000;
      var readLogs = function() {
        readTempLogs(logData.id, offset, limit, function(err, docs) {
          if (err) {
            return callback(err);
          }
          logs = logs.concat(docs);
          if (logs.length === limit) {
            offset += limit;
            return readLogs();
          }
          deleteTempLogs(logs);
          for (var i in logs) {
            logs[i].id = nodeId;
          }
          logs.push(logData);
          logs = logs.concat(memStore[logId]);
          delete memStore[logId];
          callback(null, logs);
        });
        readLogs();
      };
    };
    updateNodeId(nodeId, logId, onNodeIdUpdated);
  };

  getNodeId(function(err, docs) {
    if (err) {
      return callback(err);
    }
    var nodeId = (docs.length > 0) ? docs[0] : null;
    var self = this;
    if (nodeId) {
      logData.id = nodeId;
      return callback(null, [logData]);
    } else {
      nodeId = grepNodeID(logData.msg);
      if (!nodeId) {
        saveToTempLog();
      } else {
        updateNodeIdAndClearTempLogs(nodeId);
      }
    }
  });
};

module.exports = exports = new LookupService();
