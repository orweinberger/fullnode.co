var config = require('config').dev;
var joola = require('./lib/joola')
var common = require('./lib/common');
var blockchain = require('./lib/blockchain');
var linode = require('./lib/providers/linode');
var logger = require('winston');
var moment = require('moment');
var async = require('async');

var total_in_usd;
var coins_to_move;

function queue() {
  blockchain.checkBalance(config.general.hotWalletAddress, function (err, balance) {
    logger.info("checking balance: " + balance);
    if (!err) {
      common.getPrice(function (err, price) {
        logger.info('getting price ' + price)
        if (!err) {
          total_in_usd = Math.floor(parseFloat(price) * parseFloat((balance - 10000) / 100000000));
          coins_to_move = (config.providers.linode.price / parseFloat(price)) * 100000000;
          if (total_in_usd >= config.providers.linode.price) {
            common.queueCoins(coins_to_move, config.general.coldWalletAddress, function (err) {
              logger.info("Coins queued " + coins_to_move);
              if (!err) {
                common.queueServer('linode', function (err) {
                  if (!err) {
                    logger.info("Server queued " + coins_to_move);
                  }
                  else {
                    logger.error("[queueServer] " + err);
                  }
                });
              }
              else
                logger.error("[queueCoins] " + err);
            });
          }
        }
        else
          logger.error("[getPrice] Error! " + err);
      })
    }
    else
      logger.error("[checkBalance] Error! " + err);
  });
}

function run() {
  common.getCoinQueue(function (err, coin) {
    if (coin) {
      blockchain.moveCoins(coin, function (err, res) {
        if (err)
          logger.error("[moveCoins] " + err);
        else {
          logger.info("Moved coins");
          common.dequeueCoins(coin, function (err, res) {
            if (err)
              logger.error("[dequeueCoins] " + err);
            else {
              logger.info("dequeued coins");
              common.getServerQueue(function (err, server) {
                if (err)
                  logger.error("[getServerQueue] " + err);
                else {
                  logger.info("Got server queue");
                  linode.provisionServer(server, function (err, srv) {
                    if (err)
                      logger.error("[provisionServer] " + err);
                    else {
                      logger.info("Provisioned server");
                      common.dequeueServer(server, function (err, res) {
                        if (err)
                          logger.error("[dequeueServer] " + err);
                        else {
                          logger.info("dequeued Server");
                          joola.beacon(config.joola.collection, {"timestamp": null, "servers": 1, "ipaddress": srv.ip, "dc": srv.dc, "coins_moved": coin.amount, "serverid": srv.serverid}, function (err, doc) {
                            if (err)
                              logger.error("[beacon] " + err);
                            else {
                              logger.info("Pushed data into joola");
                              logger.info(doc);
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

function runDel() {
  var deldate = new Date(moment().subtract('days', 30).format());
  common.checkDelete(deldate, function (err) {
    logger.info("Checking if there are any servers that needs to be deleted")
    if (err)
      logger.error("[checkDelete] " + err);
  });
}

queue();
run();
runDel();

setInterval(function () {
  queue();
  run();
  runDel();
}, config.general.runInterval);

