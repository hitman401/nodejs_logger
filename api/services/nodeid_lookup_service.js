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
    var vaultNodeId = /^Node\(\w*...\)/i;
    var clientNodeId = /^Client\(\w*...\)/i;
    if (vaultNodeId.test(msg)) {
      var nodeIdStr = vaultNodeId.exec(msg)[0];
      return nodeIdStr.substring(5, nodeIdStr.length - 4);
    } else if (clientNodeId.test(msg)) {
      var clientIdStr = clientNodeId.exec(msg)[0];
      return clientIdStr.substring(5, clientIdStr.length - 4);
    }
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
          for (var i in docs) {
            logs.push(docs[i].log);
          }
          deleteTempLogs(docs);
          if (docs.length === limit) {
            offset += limit;
            return readLogs();
          }
          logs.push(logData);
          for (var i in self.memStore[logData.id]) {
            self.memStore[logData.id][i].id = nodeId;
            logs.push(self.memStore[logData.id][i]);
          }
          for (var i in logs) {
            logs[i].id = nodeId;
          }
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
    var nodeId = (docs.length > 0) ? docs[0].node_id : null;
    if (nodeId) {
      logData.id = nodeId;
      return callback(null, [logData]);
    } else {
      nodeId = grepNodeID(logData.msg);
      console.log('nodeId', nodeId);
      if (!nodeId) {
        saveToTempLog();
      } else {
        updateNodeIdAndClearTempLogs(nodeId);
      }
    }
  });
};

module.exports = exports = new LookUpService();
