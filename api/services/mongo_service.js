var util = require('util');
var config = require('../../config.json');
var mongoose = require('mongoose');
var DBService = require('./db_service');
var Transform = require('stream').Transform;
var path = require('path');
var fs = require('fs');

var createParser = function() {
  var parser = new Transform({ objectMode: true });
  /* jscs:disable disallowDanglingUnderscores */
  parser._transform = function(doc, encoding, done) {
    /* jscs:enable disallowDanglingUnderscores */
    this.push(doc.level + ',' + doc.time + ',' + doc.thread + ',' +
      doc.module + ',' + doc.file + ',' + doc.line + ',' + doc.msg + '\n');
    done();
  };
  return parser;
};

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

MongoService.prototype.search = function(Model, query, offset, limit, callback) {
  Model.find(query).skip(offset).limit(limit).exec(callback);
};

MongoService.prototype.export = function(Model, callback) {
  var generateFileName = function() {
    return (new Date()).getTime();
  };

  var setupExport = function(callback) {
    var filePath = path.join(__dirname, '../../temp/logs_' + generateFileName() + '.csv');
    fs.writeFile(filePath, 'Level,Time,Thread,Module,File,Line,Message\n', function(err) {
      if (err) {
        return callback(err);
      }
      return callback(null, filePath);
    });
  };

  setupExport(function(err, filePath) {
    if (err) {
      return callback(err);
    }
    var stream = Model.find({}, { __id: 0, __v: 0 }).batchSize(config.BATCH_SIZE).sort('-time').stream();
    var outStream = fs.createWriteStream(filePath, { 'flags': 'a' });
    var res = stream.pipe(createParser()).pipe(outStream);
    res.on('finish', function() {
      callback(null, filePath);
    });
  });
};

MongoService.prototype.clearTempFile = function(filePath, callback) {
  fs.unlink(filePath, callback);
};
module.exports = exports = new MongoService();
