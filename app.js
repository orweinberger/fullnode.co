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
var MongoClient = require('mongodb').MongoClient;

process.env.RUNNING = 0;

function run() {
  if (process.env.RUNNING == '0') {
    common.getServerQueue(function (err, server) {
      if (err)
        winston.error("[getServerQueue] " + err);
      else if (server) {
        winston.info("Got server queue");
        if (server.provider == 'Linode') {
          linode.provisionServer(server, function (err, srv) {
            if (err)
              winston.error("[provisionServer] " + err);
            else {
              winston.info("Provisioned server");
              common.dequeueServer(server, function (err, res) {
                if (err)
                  winston.error("[dequeueServer] " + err);
                else {
                  winston.info("dequeued Server");
                  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
                    if (err)
                      winston.error("[mongoUpdate] " + err);
                    var sq = db.collection('serverqueue');
                    sq.update({userid: server.userid}, {$set: {"ip": srv.ip, "dc": srv.dc, "serverid": srv.serverid, "deleted": 0}}, function (err, result) {
                      db.close();
                      if (err)
                        winston.error("[mongoUpdate] " + err);
                      else {
                        joola.beacon(config.joola.collection, {"timestamp": null, "servers": 1, "ipaddress": srv.ip, "dc": srv.dc, "serverid": srv.serverid}, function (err, doc) {
                          if (err)
                            winston.error("[beacon] " + err);
                          else {
                            winston.info("Pushed data into joola");
                            winston.info(doc);
                          }
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
        else if (server.provider == 'DigitalOcean') {
          digitalocean.provisionServer(server, function (err, srv) {
            if (err)
              winston.error("[provisionServer] " + err);
            else {
              winston.info("Provisioned server");
              common.dequeueServer(server, function (err, res) {
                if (err)
                  winston.error("[dequeueServer] " + err);
                else {
                  winston.info("dequeued Server");
                  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
                    if (err)
                      winston.error("[mongoUpdate] " + err);
                    var sq = db.collection('serverqueue');
                    sq.update({userid: server.userid}, {$set: {"ip": srv.ip_address, "dc": srv.region_name, "serverid": srv.droplet_id, "deleted": 0}}, function (err, result) {
                      db.close();
                      if (err)
                        winston.error("[mongoUpdate] " + err);
                      else {
                        joola.beacon(config.joola.collection, {"timestamp": null, "servers": 1, "ipaddress": srv.ip_address, "dc": srv.region_name, "serverid": srv.droplet_id}, function (err, doc) {
                          if (err)
                            winston.error("[beacon] " + err);
                          else {
                            winston.info("Pushed data into joola");
                            winston.info(doc);
                          }
                        });
                      }
                    });
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
  var deldate = new Date(moment().subtract('days', 30).format());
  common.checkDelete(deldate, function (err) {
    winston.info("Checking if there are any servers that needs to be deleted")
    if (err)
      winston.error("[checkDelete] " + err);
  });
}

run();
runDel();

setInterval(function () {
  run();
  runDel();
}, config.general.runInterval);


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


module.exports = app;