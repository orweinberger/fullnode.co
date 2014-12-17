if (process.env.NODE_ENV == 'production') {
  var config = require('config').prod;
}
else
  var config = require('config').dev;

var joola = require('./lib/joola');
var common = require('./lib/common');
var linode = require('./lib/providers/linode');
var digitalocean = require('./lib/providers/digitalocean');
var winston = require('winston');
var moment = require('moment');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var debug = require('debug')('generated-express-app');
var mongo = require('./lib/mongo');

process.env.RUNNING = 0;

var price = 50000;
var balance = 0;

function check(callback) {
  common.getPrice(function (err, data) {
    if (err) winston.error('[getPrice] ' + err);
    else {
      mongo.insert('price', { price: data, source: 'bitstamp', timestamp: new Date()}, function (err) {
        if (err) winston.error('[insert getPrice] ' + err);
        price = data;
        winston.info('Inserted price', data);
        common.getBalance(function (err, data) {
          if (err) winston.error('[getBalance] ' + err);
          else {
            mongo.insert('balance', { balance: data, timestamp: new Date()}, function (err) {
              if (err) winston.error('[insert getBalance] ' + err);
              balance = data;
              winston.info('Inserted balance', data);
              return callback();
            });
          }
        });
      });
    }
  });
}

function run() {
  var delete_date = new Date(moment().add(1, 'months'));
  if (process.env.RUNNING == '0') {
    common.getServerQueue(function (err, server) {
      if (err)
        winston.error("[getServerQueue] " + err);
      else if (server) {
        winston.info("Got server queue");
        if (server.provider == 'Linode') {
          linode.provisionServer(server, function (err, srv) {
            if (err) {
              process.env.RUNNING = '0';
              winston.error("[provisionServer] " + err);
            }
            else {
              winston.info("Provisioned server");
              common.dequeueServer(server, function (err, res) {
                if (err)
                  winston.error("[dequeueServer] " + err);
                else {
                  winston.info("dequeued Server");
                  common.setDNS(server.dnsName, srv.ip, function (err, result) {
                    if (err) winston.error('[setDNS] ' + err);
                    else {
                      winston.info("DNS for " + srv.ip + " Set to " + server.dnsName);
                      mongo.update('serverqueue', {dnsName: server.dnsName}, {$set: {"ip": srv.ip, "dc": srv.dc, "serverid": srv.serverid, "deleted": 0, "initialrun": 0, "delete_date": delete_date}}, function (err, result) {
                        if (err)
                          winston.error("[mongoUpdate] " + err);
                        else {
                          console.log('done');
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
        else if (server.provider == 'DigitalOcean') {
          digitalocean.provisionServer(server, function (err, srv) {
            console.log(srv);
            if (err)
              winston.error("[provisionServer] " + err);
            else {
              winston.info("Provisioned server");
              common.dequeueServer(server, function (err, res) {
                if (err)
                  winston.error("[dequeueServer] " + err);
                else {
                  winston.info("dequeued Server");
                  common.setDNS(server.dnsName, srv.ip_address, function (err, result) {
                    if (err) winston.error('[setDNS] ' + err);
                    else {
                      winston.info("DNS for " + srv.ip_address + " Set to " + server.dnsName);
                      mongo.update('serverqueue', {dnsName: server.dnsName}, {$set: {"ip": srv.ip_address, "dc": srv.region_name, "serverid": srv.droplet_id, "deleted": 0, "initialrun": 0, "delete_date": delete_date}}, function (err, result) {
                        if (err)
                          winston.error("[mongoUpdate] " + err);
                        else {
                          console.log('done');
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
  }
}

function runDel() {
  var deldate = new Date();
  common.checkDelete(deldate, function (err) {
    winston.info("Checking if there are any servers that needs to be deleted")
    if (err)
      winston.error("[checkDelete] " + err);
  });
}

run();
setInterval(function () {
  check(function () {
    if (balance - 0.0001 >= config.general.cost / price) {
      var provider = config.providers.list[Math.floor(Math.random() * config.providers.list.length)];
      console.log('running provider', provider);
      var dnsName = common.generateNodeName();
      common.queueServer(provider, dnsName, function (err) {
        if (!err) {
          winston.info("Server queued");
          common.moveCoins(config.general.coldStorage, config.general.cost / price, function (err, txid) {
            if (err) winston.error("[moveCoins] " + err);
            else {
              winston.info("Moved " + config.general.cost / price + " BTC to " + config.general.coldStorage);
            }
          });
        }
        else {
          winston.error("[queueServer] " + err);
        }
      });
    }
    run();
    runDel();
  });
}, 20000);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.set('port', process.env.PORT || 3000);

var io = require('socket.io').listen(app.listen(3000));
require('./sockets').setIO(io);
app.locals.moment = require('moment');
module.exports = app;
