var config = require('config').dev;
var https = require("https");
var MongoClient = require('mongodb').MongoClient;
var linode = require('./providers/linode');
var logger = require('winston');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var client = new (require('linode-api').LinodeClient)(config.providers.linode.apikey);

exports.checkDelete = function (date, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    sq.findOne({"timestamp": {$lte: date}, "deleted": 0}, function (err, result) {
      if (err)
        return callback(err);
      if (result) {
        sq.update({"_id": new ObjectId(result._id)}, {$set: {deleted: 1, deletedate: new Date()}}, function (err, res) {
          linode.deleteServer(result.serverid, function (err) {
            if (err)
              return callback(err)
            else
              return callback(null);
          });
        });
      }
      else
        return callback(null);
    });
  });
}

exports.queueServer = function (provider, userid, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    var ts = new Date();
    sq.insert({"timestamp": ts, "provider": provider, "userid": userid, "provisioned": 0, "dnsset": 0}, function (err, res) {
      if (!err)
        return callback(null);
      else
        return callback(err);
    });
  });
}

exports.dequeueServer = function (srv, callback) {
  console.log("srv" + srv);
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

exports.getServerQueue = function (callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    sq.findOne({"provisioned": 0}, function (err, res) {
      if (err)
        return callback(err);
      else if (res)
        return callback(null, res);
      else
        return callback();
    });
  });
}


exports.uuid = function () {
  var uuid = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 18; i++)
    uuid += possible.charAt(Math.floor(Math.random() * possible.length));
  return uuid;
};

exports.checkDNS = function (dns, callback) {
  var result;
  client.call('domain.resource.list', {"DomainID": 575715}, function (err, res) {
    if (err)
      return callback(err)
    else {
      res.forEach(function (d) {
        if (d.NAME == dns)
          result = true;

      });
      if (result)
        return callback(null, true)
      else
        return callback(null, false);
    }
  });
}

exports.setDNS = function (name, ip, callback) {
  if (name == "admin" || name == "www" || name == "") {
    name = this.uuid();
  }
  client.call('domain.resource.list', {"DomainID": 575715}, function (err, res) {
    if (err)
      return callback(err);
    res.forEach(function (r) {
      if (name == r.NAME)
        return callback("resource already exists");
    });
    client.call('domain.resource.create', {"DomainID": 575715, "type": "A", "name": name, "target": ip}, function (err, domains) {
      if (err)
        return callback(err)
      else
        return callback(null);
    });
  });
}
