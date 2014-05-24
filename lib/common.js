var config = require('config').dev;
var https = require("https");
var MongoClient = require('mongodb').MongoClient;
var linode = require('./providers/linode');
var logger = require('winston');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;

exports.getPrice = function (callback) {
  var url = "https://www.bitstamp.net/api/ticker/";
  var request = https.get(url, function (response) {
    var buffer = "",
      data,
      route;

    response.on("data", function (chunk) {
      buffer += chunk;
    });

    response.on("end", function (err) {
      try {
        data = JSON.parse(buffer);
      } catch (e) {
        return callback(e)
      }

      if (!err)
        if (data && data.last && data.last > 0)
          return callback(null, data.last);
        else
          return callback('data error');
      else
        return callback(err)
    });
  });
}

exports.checkDelete = function (date, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var Server = db.collection('servers');
    Server.find({"timestamp": {$lte: date}}).toArray(function (err, results) {
      async.each(results, linode.deleteServer, function (err) {
        if (err)
          return callback(err);
        else
          return callback(null, true);
      });
      db.close();
    });
  });
}

exports.queueServer = function (provider, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    var ts = new Date();
    sq.insert({"timestamp": ts, "provider": provider, "provisioned": 0}, function (err, res) {
      if (!err)
        return callback(null);
      else
        return callback(err);
    });
  });
}

exports.dequeueServer = function (srv, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    sq.update({"_id": new ObjectId(srv._id)}, {$set: {provisioned: 1}}, function (err, res) {
      if (!err)
        return callback(null);
      else
        return callback(err);
    });
  });
}

exports.queueCoins = function (amount, to, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {

    var sq = db.collection('coinqueue');
    var ts = new Date();
    sq.find({"moved": 0}).toArray(function (err, res) {
      if (res.length === 0) {
        sq.insert({"timestamp": ts, "amount": amount, to: to, "moved": 0}, function (err, res) {
          if (!err)
            return callback(null);
          else
            return callback(err);
        });
      }
    });
  });
}

exports.dequeueCoins = function (queue_id, callback) {
  queue_id = queue_id._id;
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('coinqueue');
    sq.update({"_id": new ObjectId(queue_id)}, {$set: {moved: 1}}, function (err, res) {
      if (!err)
        return callback(null);
      else
        return callback(err);
    });
  });
}

exports.getServerQueue = function (callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    sq.findOne({"provisioned": 0}, function (err, res) {
      if (!err)
        return callback(null, res);
      else
        return callback(err);
    });
  });
}

exports.getCoinQueue = function (callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('coinqueue');
    sq.findOne({"moved": 0}, function (err, res) {
      if (!err)
        return callback(null, res);
      else
        return callback(err);
    });
  });
}