var mongoService = require('./mongo_service');

var DAO = function() {
  this.mongoService = mongoService;
};

DAO.prototype.getDBConnector = function() {
  return this.mongoService;
};

module.exports = exports = new DAO();
