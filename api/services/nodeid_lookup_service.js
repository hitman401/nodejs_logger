var LookUpService = function() {
  this.daoService = require('./dao_service');
  var dbConnector = this.daoService.getDBConnector();
  this.nodeIdLookup = dbConnector.getModel(dbConnector.MODEL_TYPES.LOOKUP);
  this.tempLog = dbConnector.getModel(dbConnector.MODEL_TYPES.TEMPLOG);
  this.memStore = {}
};

LookUpService.prototype.find = function(logData, callback) {
  var self = this;

  if (self.memStore[logData.id]) {
    self.memStore[logData.id].push(logData);
    return callback();
  }

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
    self.memStore[logId] = [];
    self.nodeIdLookup.findOneAndUpdate({node_id: nodeId}, {node_id: nodeId, log_id: logId}, function(e, d) {
      if (e) {
        return callback(e);
      }
      if (d) {
        return callback();
      }
      self.daoService.getDBConnector().save(self.nodeIdLookup, {node_id: nodeId, log_id: logId}, callback);
    });
  };

  var grepNodeID = function(msg) {
    return msg.indexOf('nodeid:') === 0 ? msg.split(':')[1] : null;
  };

  var saveToTempLog = function() {
    var data = {log_id: logData.id, log: logData};
    self.daoService.getDBConnector().save(self.tempLog, data, function(err) {
      callback(err);
    });
  };

  var updateNodeIdAndClearTempLogs = function(nodeId) {
    var logs = [];
    updateNodeId(nodeId, logData.id, function(err) {
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
          if (docs.length === limit) {
            offset += limit;
            return readLogs();
          }
          deleteTempLogs(docs);
          for (var i in logs) {
            logs[i].id = nodeId;
          }
          logs.push(logData);
          logs = logs.concat(self.memStore[logData.id]);
          delete self.memStore[logData.id];
          callback(null, logs);
        });
      };
      readLogs();
    });
  };

  getNodeId(logData.id, function(err, docs) {
    if (err) {
      return callback(err);
    }
    var nodeId = (docs.length > 0) ? docs[0] : null;
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

module.exports = exports = new LookUpService();
