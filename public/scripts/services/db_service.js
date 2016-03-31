var DBService = function() {
  this.db = null;
  this.MODELS = {};
};

DBService.prototype.getModel = function(modelName) {
  return null;
};

DBService.prototype.connect = function(callback) {
  return callback('Not Implemented');
};

DBService.prototype.save = function(Model, payload, callback) {
  return callback('Not Implemented');
};

DBService.prototype.list = function(Model, limit, offset, callback) {
  return callback('Not Implemented');
};

DBService.prototype.search = function(Model, query, limit, callback) {
  return callback('Not Implemented');
};

module.exports = DBService;
