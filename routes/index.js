var config = require('config').dev;
var joola = require('../lib/joola')
var common = require('../lib/common');
var blockchain = require('../lib/blockchain');
var linode = require('../lib/providers/linode');
var winston = require('winston');
var moment = require('moment');


function queue() {
  common.queueServer('linode', function (err) {
    if (!err) {
      winston.info("Server queued");
    }
    else {
      winston.error("[queueServer] " + err);
    }
  });
}
exports.index = function (req, res) {
  res.render('index');
}


exports.callbackurl = function (req, res) {
  var order = req.body.order;
  if (order.status == "completed" && order.total_native.cents == config.providers.linode.price * 100) {
    queue();
  }
  return res.send(200);
}