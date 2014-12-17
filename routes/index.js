if (process.env.NODE_ENV == 'production') {
  var config = require('config').prod;
}
else
  var config = require('config').dev;

var joola = require('../lib/joola');
var common = require('../lib/common');
var linode = require('../lib/providers/linode');
var winston = require('winston');
var moment = require('moment');
var express = require('express');
var router = express.Router();
var mongo = require('../lib/mongo');

router.get('/', function (req, res) {
  mongo.fetch('price', {}, {"sort": {"timestamp": -1}, "limit": 1}, function (err, price) {
    mongo.fetch('balance', {}, {"sort": {"timestamp": -1}, "limit": 1}, function (err, balance) {
      mongo.fetch('serverqueue', {provisioned: 1, deleted: 0}, {"sort": {"timestamp": -1}}, function (err, servers) {
        return res.render('index', { title: 'Fullnode.co - Adopt a full node', price: price[0].price, balance: balance[0].balance, servers: servers, count: servers.length, hotwallet: config.general.hotStorage });
      });
    });
  });
});

router.get('/data', function (req, res) {
  mongo.fetch('price', {}, {"sort": {"timestamp": -1}, "limit": 1}, function (err, price) {
    mongo.fetch('balance', {}, {"sort": {"timestamp": -1}, "limit": 1}, function (err, balance) {
      mongo.fetch('serverqueue', {provisioned: 1, deleted: 0}, {"sort": {"timestamp": -1}}, function (err, servers) {
        res.status(200).json({price: price[0].price, balance: balance[0].balance, servers: servers});
      });
    });
  });
});

module.exports = router;