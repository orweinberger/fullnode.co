var options = require('./config.js');
var joola = require('./lib/joola')
var common = require('./lib/common');
var blockchain = require('./lib/blockchain');
var linode = require('./lib/providers/linode');

var total_in_usd;
var coins_to_move;

function run() {
  blockchain.checkBalance(options.hotWalletAddress, function (err, balance) {
    console.log('checking balance', balance);
    if (!err) {
      common.getPrice(function (err, price) {
        console.log('getting price', price)
        if (!err) {
          total_in_usd = Math.floor(parseFloat(price) * parseFloat((balance - 10000) / 100000000));
          coins_to_move = (20 / parseFloat(price)) * 100000000;
          if (total_in_usd >= 20) {
            blockchain.moveCoins(options.coldWalletAddress, coins_to_move, function (err) {
              if (!err)
                linode.provisionServer(function (err, ip, dcname, serverid) {
                  if (!err)
                    joola.beacon("bitcoin", {"timestamp": null, "servers": 1, "ipaddress": ip, "dc": dcname, "coins_moved": parseFloat(coins_to_move), "serverid": serverid}, function (err, doc) {
                      if (!err) {
                        console.log('DONE, pushed', doc);
                      }
                      else
                        console.log("[beacon] Error!", err)
                    });
                  else
                    console.log("[provisionServer] Error!", err);
                });
              else
                console.log("[moveCoins] Error! ", err)
            });
          }
        }
        else
          console.log("[getPrice] Error!", err);
      })
    }
    else
      console.log("[checkBalance] Error!", err);
  });
}

run();

setInterval(function () {
  run();
}, 30000);

