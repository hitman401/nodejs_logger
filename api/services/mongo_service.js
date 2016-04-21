var util = require('util');
var config = require('../../config.json');
var mongoose = require('mongoose');
var DBService = require('./db_service');

var MongoService = function() {
  this.db = null;
  this.MODEL_TYPES = {
    'LOGS': 'logs',
    'LOOKUP': 'node_id_lookup_table',
    'TEMPLOG': 'temp_logs_table'
  };
};

util.inherits(MongoService, DBService);

/**
 * Mongo connnection
 */
MongoService.prototype.connect = function(callback) {
  var self = this;
  mongoose.connect(config.dbPath);
  self.db = mongoose.connection;
  self.db.on('error', function(err) {
    console.error.bind(console, 'connection error:');
    callback(err);
  });
  self.db.once('open', function() {
    callback(null, 'Connected with Mongo');
  });
};

MongoService.prototype.getModel = function(modelType, modelName) {
  var self = this;
  modelName = modelName || modelType;
  var prepareModel = function(schema) {
    var model = mongoose.models[modelName];
    if (!model) {
      model = mongoose.model(modelName, new mongoose.Schema(schema, {
                  timestamps: true
              }));
    }
    return model;
  };
  switch (modelType) {
    case self.MODEL_TYPES.LOGS:
      return prepareModel({
        level: String,
        time: { type: Date, default: Date.now },
        thread: String,
        module: String,
        file: String,
        line: String,
        msg: String,
      });

    case self.MODEL_TYPES.LOOKUP:
      return prepareModel({
        node_id: String,
        log_id: String,
      });

    case self.MODEL_TYPES.TEMPLOG:
      return prepareModel({
        log_id: String,
        log: {},
      });

    default:
      return null;
  }
};

MongoService.prototype.save = function(Model, payload, callback) {
  var modelObj = new Model(payload);
  modelObj.save(function(err, data) {
    if (err) {
      return callback(err);
    }
    return callback(null, data);
  });
};

MongoService.prototype.list = function(Model, limit, offset, callback) {
  Model.find().skip(offset).limit(limit).sort('-time').exec(callback);
};

MongoService.prototype.search = function(Model, query, limit, callback) {
  Model.find(query).limit(limit).exec(callback);
};

module.exports = exports = new MongoService();
