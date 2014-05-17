var http = require("http");
var https = require("https");
var joolaio = require('joola.io.sdk');
var options = require('./config.js');

var BlockchainWallet = require('blockchain-wallet');
var blockchainWallet = new BlockchainWallet(options.blockchainID, options.blockchainPassword);

var total_in_usd;
var coins_to_move;

function checkBalance(address, callback) {
  blockchainWallet.list(function (err, data) {
    if (err) 
      return callback(err);
    return callback(null, data.addresses[0].balance);
  });
}

function getPrice(callback) {
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

function provisionServer(callback) {
  console.log('in provision function');
  var dcArr = [2, 3, 4, 7, 8];
  var dc = dcArr[Math.floor(Math.random() * dcArr.length)];
  var client = new (require('linode-api').LinodeClient)(options.linodeAPIKey);

  client.call('linode.create', {DatacenterID: dc, PlanID: 1, PaymentTerm: 1}, function (err, res) {
    var linode_id = res.LinodeID;
    if (!err)
      client.call('linode.disk.createfromstackscript', {LinodeID: linode_id, StackScriptID: 8878, StackScriptUDFResponses: {}, DistributionID: 127, Label: "fullnode", Size: 48640, rootPass: options.rootPass}, function (err, res) {
        var disk_id = res.DiskID;
        if (!err) {
          client.call('linode.disk.create', {LinodeID: linode_id, Label: "swap", Size: 512, Type: "swap"}, function (err, res) {
            var swap_id = res.DiskID;
            if (!err) {
              client.call('linode.config.create', {LinodeID: linode_id, KernelID: 165, Label: "Fullnode", DiskList: disk_id + "," + swap_id}, function (err, res) {
                if (!err) {
                  client.call('linode.boot', {LinodeID: linode_id, ConfigID: res.ConfigID}, function (err, res) {
                    if (!err) {
                      client.call('linode.ip.list', {LinodeID: linode_id}, function (err, res) {
                        if (!err) {
                          return callback(err, res[0].IPADDRESS);
                        }
                        else
                          return callback(err);
                      });

                    }
                    return callback(err)
                  });
                }
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
    else
      return callback(err);
  });
}

function moveCoins(toaddress, amount, callback) {
  console.log('moving coins!');
  blockchainWallet.payment(toaddress, Math.floor(amount), {},function (err, data) {
    console.log('payment sent!');
    if (err)
      return callback(err);
    return callback(null, data);
  });
}

function beacon(collection, doc, callback) {
  var joptions = {
    "host": options.joolaHost,
    "APIToken": options.joolaAPIToken
  }
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

function run() {
  checkBalance(options.hotWalletAddress, function (err, balance) {
    console.log('checking balance', balance);
    if (!err) {
      getPrice(function (err, price) {
        console.log('getting price', price)
        if (!err) {
          total_in_usd = Math.floor(parseFloat(price) * parseFloat(balance/100000000));
          coins_to_move = (3 / parseFloat(price))*100000000;
          if (total_in_usd >= 3) {
            console.log('after if', total_in_usd);
            provisionServer(function (err) {
              console.log('in provision cb');
              if (!err)
                moveCoins(options.coldWalletAddress, coins_to_move, function (err) {
                  if (!err)
                    beacon("bitcoin", {"timestamp": null, servers: 1, coins_moved: parseFloat(coins_to_move)}, function (err, doc) {
                      if (!err) {
                        console.log('DONE');
                      }
                      else
                        console.log("[beacon] Error!", err)
                    });
                  else
                    console.log("[moveCoins] Error!", err);
                });
              else
                console.log("[provisionServer] Error! ", err)
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
}, 60000);

