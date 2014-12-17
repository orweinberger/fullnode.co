if (process.env.NODE_ENV == 'production') {
  var config = require('config').prod;
}
else
  var config = require('config').dev;

var https = require("https");
var MongoClient = require('mongodb').MongoClient;
var linode = require('./providers/linode');
var digitalocean = require('./providers/digitalocean');
var logger = require('winston');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var client = new (require('linode-api').LinodeClient)(config.providers.linode.apikey);
var bitcoin = require('bitcoin');
var request = require('request');

exports.checkDelete = function (date, callback) {
  var self = this;
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    if (err)
      return callback(err);
    var sq = db.collection('serverqueue');
    sq.findOne({"delete_date": {$lte: date}, "deleted": 0}, function (err, result) {
      if (err)
        return callback(err);
      if (result) {
        sq.update({"_id": new ObjectId(result._id)}, {$set: {deleted: 1}}, function (err, res) {
          db.close();
          if (result.provider == "Linode") {
            linode.deleteServer(result.serverid, function (err) {
              if (err)
                return callback(err);
              else {
                self.unsetDNS(result.dnsName, function (err) {
                  if (err)
                    return callback(err);
                  else {
                    return callback(null);
                  }
                });
              }
            });
          }
          else if (result.provider == "DigitalOcean") {
            digitalocean.deleteServer(result.serverid, function (err) {
              if (err)
                return callback(err);
              else {
                self.unsetDNS(result.dnsName, function (err) {
                  if (err)
                    return callback(err);
                  else {
                    return callback(null);
                  }
                });
              }
            });
          }
        });
      }
      else {
        db.close();
        return callback(null);
      }

    });
  });
};

exports.queueServer = function (provider, dnsName, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    var ts = new Date();
    sq.insert({"timestamp": ts, "provider": provider, "dnsName": dnsName, "provisioned": 0, "dnsset": 0}, function (err, res) {
      db.close();
      if (!err) {
        return callback(null);
      }
      else
        return callback(err);
    });
  });
};

exports.dequeueServer = function (srv, callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    var sq = db.collection('serverqueue');
    sq.update({"_id": new ObjectId(srv._id)}, {$set: {provisioned: 1}}, function (err, res) {
      db.close();
      if (!err) {
        return callback(null);
      }
      else
        return callback(err);
    });
  });
};

exports.getServerQueue = function (callback) {
  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
    if (err)
      return callback(err);
    var sq = db.collection('serverqueue');
    sq.findOne({"provisioned": 0}, function (err, res) {
      db.close();
      if (err)
        return callback(err);
      else if (res)
        return callback(null, res);
      else
        return callback();
    });
  });
};


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
      return callback(err);
    else {
      res.forEach(function (d) {
        if (d.NAME == dns)
          result = true;

      });
      if (result)
        return callback(null, true);
      else
        return callback(null, false);
    }
  });
};

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
        return callback(err);
      else
        return callback(null, name);
    });
  });
};

exports.unsetDNS = function (name, callback) {
  var todelete;
  client.call('domain.resource.list', {"DomainID": 575715}, function (err, res) {
    if (err)
      return callback(err);
    res.forEach(function (r) {
      if (name == r.NAME)
        todelete = r.RESOURCEID;
    });
    client.call('domain.resource.delete', {"DomainID": 575715, "ResourceID": todelete}, function (err, domains) {
      if (err)
        return callback(err);
      else
        return callback(null);
    });
  });
};

exports.getBalance = function (callback) {
  var client = new bitcoin.Client({
    host: config.bitcoind.host,
    port: config.bitcoind.port,
    user: config.bitcoind.username,
    pass: config.bitcoind.password,
    timeout: 30000
  });
  client.getBalance('', 1, function (err, balance, resHeaders) {
    if (err) return callback(err);
    return callback(null, balance);
  });
};

exports.moveCoins = function (address, amount, callback) {
  var client = new bitcoin.Client({
    host: config.bitcoind.host,
    port: config.bitcoind.port,
    user: config.bitcoind.username,
    pass: config.bitcoind.password,
    timeout: 30000
  });
  client.sendToAddress(address, amount, function (err, txid, resHeaders) {
    if (err) return callback(err);
    return callback(null, txid);
  });
};

exports.generateNodeName = function () {
  var color = [
    'black',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'gray',
    'black',
    'white',
    'silver'
  ];
  var size = [
    'big',
    'small',
    'great',
    'tiny',
    'little',
    'massive',
    'large',
    'medium',
    'huge',
    'gigantic',
    'thin',
    'thick',
    'happy',
    'scary',
    'sad',
    'angry',
    'lucky',
    'playful',
    'calm',
    'brave',
    'clever',
    'stupid',
    'nice',
    'awesome'
  ];
  var animal = [
    'tiger',
    'whale',
    'badger',
    'snake',
    'hawk',
    'eagle',
    'alligator',
    'monkey',
    'beaver',
    'bat',
    'bee',
    'butterfly',
    'wasp',
    'camel',
    'chicken',
    'coyote',
    'crow',
    'dog',
    'cat',
    'duck',
    'elephant',
    'fox',
    'horse',
    'donkey',
    'lion',
    'llama',
    'penguin',
    'pony',
    'bear',
    'rat',
    'rabbit',
    'bunny',
    'owl',
    'goat',
    'gorilla',
    'cheetah',
    'crab',
    'dolphin',
    'falcon',
    'giraffe',
    'octopus',
    'panda',
    'cow'
  ];
  return size[Math.floor(Math.random() * size.length)] + '-' + color[Math.floor(Math.random() * color.length)] + '-' + animal[Math.floor(Math.random() * animal.length)] + '-' + (Math.floor(Math.random() * 999) + 1);
};

exports.getPrice = function (callback) {
  request.get('https://www.bitstamp.net/api/ticker/', function (err, body, data) {
    if (err || body.statusCode != 200) return callback(err);
    var jsonData = JSON.parse(data);
    if (parseFloat(jsonData.last) > 0)
      return callback(null, parseFloat(jsonData.last));
    else
      return callback('Could not get price');
  });
};