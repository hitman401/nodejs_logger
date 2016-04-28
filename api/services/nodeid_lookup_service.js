var Queue = function(id, lookupService) {
  var self = this;
  self.id = id;
  self.isRunning = false;
  self.list = [];
  self.nodeId = null;
  var LOG_SUFFIX = "_logs";

  var grepNodeID = function(msg) {
    var vaultNodeId = /^Vault \w*../i;
    var clientNodeId = /^Client \w*../i;
    if (vaultNodeId.test(msg)) {
      var nodeIdStr = vaultNodeId.exec(msg)[0];
      return nodeIdStr.substring(6, nodeIdStr.length - 2);
    } else if (clientNodeId.test(msg)) {
      var clientIdStr = clientNodeId.exec(msg)[0];
      return clientIdStr.substring(6, clientIdStr.length - 2);
    }
    return null;
  };

  var readTempLogs = function(logId, offset, limit, callback) {
    lookupService.tempLog.find({log_id: logId}).skip(offset).limit(limit).exec(callback);
  };

  var saveToTempLog = function(logData, done) {
    var data = {log_id: logData.id, log: logData};
    console.log('---------------------------saving temp log');
    lookupService.daoService.getDBConnector().save(lookupService.tempLog, data, function(err) {
      if (err) {
        console.log('Error while saving in temp table', err);
      }
      console.log('saved');
      done();
    });
  };

  var deleteTempLogs = function(tempLogs) {
    for (var i in tempLogs) {
      lookupService.tempLog.findByIdAndRemove(tempLogs[i]._id, function() { });
    }
  };

  var updateNodeId = function(nodeId, logId, callback) {
    lookupService.nodeIdLookup.findOneAndUpdate({node_id: nodeId}, {node_id: nodeId, log_id: logId}, function(e, d) {
      if (e) {
        return callback(e);
      }
      if (d) {
        return callback();
      }
      lookupService.daoService.getDBConnector().save(lookupService.nodeIdLookup, {node_id: nodeId, log_id: logId}, callback);
    });
  };

  var updateNodeIdAndClearTempLogs = function(nodeId, logData, done) {
    var logs = [];
    updateNodeId(nodeId, logData.id, function(err) {
      if (err) {
        return console.log('Error while updating nodeId', nodeId, err);
      }
      var offset = 0;
      var limit = 1000;

      var prepareModel = function() {
        var dbConnector = lookupService.daoService.getDBConnector();
        return dbConnector.getModel(dbConnector.MODEL_TYPES.LOGS, nodeId + LOG_SUFFIX);
      };

      var readLogs = function() {
        readTempLogs(logData.id, offset, limit, function(err, docs) {
          if (err) {
            return console.log('Error while reading temp logs', nodeId, err);
          }
          console.log('Temp log size', nodeId, docs.length);
          for (var i in docs) {
            logs.push(docs[i].log);
          }
          deleteTempLogs(docs);
          if (docs.length === limit) {
            offset += limit;
            return readLogs();
          }
          logs.push(logData);
          var len = self.list.length;
          console.log('In Queue', nodeId, self.list.length);
          while (len !== 0) {
            logs.push(self.list.shift());
            len--;
          }
          for (var i in logs) {
            logs[i].id = nodeId;
          }
          delete lookupService.queue[self.id];
          var logModel = prepareModel();
          logs.forEach(function(log, pos) {
            lookupService.daoService.getDBConnector().save(logModel, log, function(err) {
              if (err) {
                console.log('Error while saving log to actual table', err);
              }
              if (pos === logs.length - 1) {
                done();
              }
            });
          });
        });
      };
      readLogs();
    });
  };

  var run = function() {
    if (self.isRunning || self.list.length === 0) {
      return;
    }
    self.isRunning = true;
    var onExecComplete = function() {
      if (self.list.length === 0) {
        self.isRunning = false;
      } else {
        exec();
      }
    };

    var exec = function() {
      var log = self.list.shift();
      if (!self.nodeId) {
        self.nodeId = grepNodeID(log.msg);
      }
      if (!self.nodeId) {
        saveToTempLog(log, onExecComplete);
      } else {
        updateNodeIdAndClearTempLogs(self.nodeId, log, onExecComplete);
      }
    };
    exec();
  };

  self.push = function(logData) {
    self.list.push(logData);
    run();
  };

};


var LookUpService = function() {
  this.daoService = require('./dao_service');
  var dbConnector = this.daoService.getDBConnector();
  this.nodeIdLookup = dbConnector.getModel(dbConnector.MODEL_TYPES.LOOKUP);
  this.tempLog = dbConnector.getModel(dbConnector.MODEL_TYPES.TEMPLOG);
  this.queue = {};
};

LookUpService.prototype.find = function(logData, callback) {
  var self = this;

  if (self.queue[logData.id]) {
    self.queue[logData.id].push(logData);
    return callback();
  }

  var getNodeId = function(logId, callback) {
    self.nodeIdLookup.find({log_id: logId}).exec(callback);
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
      if (!self.queue.hasOwnProperty(logData.id)) {
        console.log('***************creating queue', logData.id);
        self.queue[logData.id] = new Queue(logData.id, self);
      }
      self.queue[logData.id].push(logData);
      callback();
    }
  });
};

module.exports = exports = new LookUpService();
