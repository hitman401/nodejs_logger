var util = require('util');
var config = require('../../config.json');
var mongoose = require('mongoose');
var DBService = require('./db_service');

var MongoService = function() {
  this.db = null;
  this.MODEL_TYPES = {
    'LOGS': 'logs'
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
  var schema = null;
  var model = null;
  switch (modelType) {
    case self.MODEL_TYPES.LOGS:
      schema = {
        level: String,
        time: { type: Date, default: Date.now },
        thread: String,
        module: String,
        file: String,
        line: String,
        msg: String,
      };
      model = mongoose.models[modelName];
      if (!model) {
        model = mongoose.model(modelName, new mongoose.Schema(schema));
      }
      return model;
      break;
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
