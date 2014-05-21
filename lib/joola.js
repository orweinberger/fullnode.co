var options = require('../config.js');
var joolaio = require('joola.io.sdk');
var MongoClient = require('mongodb').MongoClient;

exports.beacon = function (collection, doc, callback) {
  var localdoc = doc;
  localdoc.timestamp = new Date();
  var joptions = {
    "host": options.joolaHost,
    "APIToken": options.joolaAPIToken
  }
  MongoClient.connect("mongodb://localhost:27017/fullnode", function (err, db) {
    var Server = db.collection('servers');
    Server.insert(localdoc, {w: 1}, function (err, result) {
      if (!err) {
        joolaio.init(joptions, function (err, result) {
          if (!err) {
            joolaio.beacon.insert(collection, doc, function (err, pushedDocument) {
              if (!err)
                return callback(null, pushedDocument);
              else
                return callback(err);
            });
          }
          else
            return callback(err);
        });
      }
      else
        return callback(err);
    });
  });
}