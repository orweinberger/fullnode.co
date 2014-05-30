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

exports.queueServer = function (provider, dns, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    var ts = new Date();
    sq.insert({"timestamp": ts, "provider": provider, "dns": dns, "provisioned": 0}, function (err, res) {
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


function uuid() {
  var uuid = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 18; i++)
    uuid += possible.charAt(Math.floor(Math.random() * possible.length));

  return uuid;
};

exports.checkDNS = function(dns, callback) {
  var result;
  client.call('domain.resource.list', {"DomainID": 575715}, function (err, res) {
    if (err)
      return callback(err)
    else {
      res.forEach(function(d) {
        if (d.NAME == dns)
          result = true;
          
      });
      if (result)
        return callback(null,true)
      else
        return callback(null,false);
    }
  });
}

exports.setDNS = function (name, ip, callback) {
  if (name == "admin" || name == "www" || name == "") {
    name = uuid();
  }
  client.call('domain.resource.list', {"DomainID": 575715}, function (err, res) {
    if (!err) {
      res.forEach(function(r) {
        if (name == r.NAME)
          return callback("resource already exists");
      });
      client.call('domain.resource.create', {"DomainID": 575715, "type": "A", "name": name, "target": ip}, function (err, domains) {
        if (err)
          return callback(err)
        else
          return callback(null);
      });
    }
  });
}
