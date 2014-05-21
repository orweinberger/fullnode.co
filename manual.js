var http = require("http");
var https = require("https");
var joolaio = require('joola.io.sdk');
var options = require('./config.js');
var MongoClient = require('mongodb').MongoClient;

var BlockchainWallet = require('blockchain-wallet');
var blockchainWallet = new BlockchainWallet(options.blockchainID, options.blockchainPassword);

var total_in_usd;
var coins_to_move;
function provisionServer(callback) {
  console.log('in provision function');
  var dcArr = [
    {"dcId": 2, "name": "Dallas, TX, USA"},
    {"dcId": 3, "name": "Fremont, CA, USA"},
    {"dcId": 4, "name": "Atlanta, GA, USA"},
    {"dcId": 6, "name": "Newark, NJ, USA"},
    {"dcId": 7, "name": "London, England, UK"},
    {"dcId": 8, "name": "Tokyo, JP"}
  ];
  var dc = dcArr[Math.floor(Math.random() * dcArr.length)];
  var client = new (require('linode-api').LinodeClient)(options.linodeAPIKey);

  client.call('linode.create', {DatacenterID: dc.dcId, PlanID: 1, PaymentTerm: 1}, function (err, res) {
    console.log('calling linode.create');
    if (!err) {
      var linode_id = res.LinodeID;
      client.call('linode.disk.createfromstackscript', {LinodeID: linode_id, StackScriptID: 8878, StackScriptUDFResponses: {}, DistributionID: 127, Label: "fullnode", Size: 48640, rootPass: options.rootPass}, function (err, res) {
        console.log('calling linode.disk.createfromstackscript');
        var disk_id = res.DiskID;
        if (!err) {
          client.call('linode.disk.create', {LinodeID: linode_id, Label: "swap", Size: 512, Type: "swap"}, function (err, res) {
            console.log('calling linode.disk.create');
            var swap_id = res.DiskID;
            if (!err) {
              client.call('linode.config.create', {LinodeID: linode_id, KernelID: 165, Label: "Fullnode", DiskList: disk_id + "," + swap_id}, function (err, res) {
                console.log('calling linode.config.create');
                if (!err) {
                  client.call('linode.boot', {LinodeID: linode_id, ConfigID: res.ConfigID}, function (err, res) {
                    console.log('calling linode.boot');
                    if (!err) {
                      client.call('linode.ip.list', {LinodeID: linode_id}, function (err, res) {
                        console.log('calling linode.ip.list');
                        if (!err) {
                          console.log('returning final callback');
                          return callback(null, res[0].IPADDRESS, dc.name);
                        }
                        else
                          return callback(err);
                      });
                    }
                    else
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
    }
    else
      return callback(err);
  });
}

function beacon(collection, doc, callback) {
  var localdoc = doc;
  localdoc.timestamp = new Date();
  var joptions = {
    "host": options.joolaHost,
    "APIToken": options.joolaAPIToken
  }
  MongoClient.connect("mongodb://localhost:27017/fullnode", function (err, db) {
    var Server = db.collection('servers');
    Server.insert(localdoc, {w: 1}, function (err, result) {
      if (!err) {
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
      else
        return callback(err);
    });
  });
}

provisionServer(function (err, ip, dcname) {
  if (!err)
    beacon("bitcoin", {"timestamp": null, "servers": 1, "ipaddress": ip, "dc": dcname, "coins_moved": parseFloat(0.04019373)}, function (err, doc) {
      if (!err) {
        console.log('DONE, pushed', doc);
      }
      else
        console.log("[beacon] Error!", err)
    });
  else
    console.log("[provisionServer] Error!", err);
});