var config = require('config').dev;
var joola = require('../lib/joola');
var common = require('../lib/common');
var blockchain = require('../lib/blockchain');
var linode = require('../lib/providers/linode');
var winston = require('winston');
var moment = require('moment');
var express = require('express');
var router = express.Router();

function queue(dns) {
  common.queueServer('linode', dns, function (err) {
    if (!err) {
      winston.info("Server queued");
    }
    else {
      winston.error("[queueServer] " + err);
    }
  });
}

router.get('/', function (req, res) {
  res.render('index', { title: 'Fullnode.co - Adopt a full node' });
});

router.get('/faq', function (req, res) {
  res.render('faq', { title: 'Fullnode.co - Adopt a full node' });
});


router.post('/callback', function (req, res) {
  if (req.query.secret == config.general.callbackSecret) {
    var order = req.body.order;
    var dns = req.body.order.custom;
    dns = dns.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-')
    if (order.status == "completed" && order.total_native.cents == config.providers.linode.price * 100) {
      queue(dns);
    }
    return res.send(200);
  }
  else
    return res.send(403);
});

module.exports = router;