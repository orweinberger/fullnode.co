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

var ssh = require('ssh2');
var scp = require('scp2')

process.env.RUNNING = 0;
process.env.SSH_RUNNING = 0;

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
                    sq.update({userid: server.userid}, {$set: {"ip": srv.ip, "dc": srv.dc, "serverid": srv.serverid, "deleted": 0, "initialrun": 0}}, function (err, result) {
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
                    sq.update({userid: server.userid}, {$set: {"ip": srv.ip_address, "dc": srv.region_name, "serverid": srv.droplet_id, "deleted": 0, "initialrun": 0}}, function (err, result) {
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

function runSSH() {
  if (process.env.SSH_RUNNING == '0') {
    common.getSSHQueue(function (err, server) {
      winston.info("Getting SSH Queue");
      if (server) {
        if (err)
          winston.error("[getSSHQueue] " + err);
        else {
          process.env.SSH_RUNNING = 1;
          winston.info("Trying to transfer resources");
          scp.scp('./resources/', {
            host: server.ip,
            username: 'root',
            privateKey: require('fs').readFileSync('./resources/fullnode.pem'),
            path: '/tmp'
          }, function (err) {
            if (err) {
              process.env.SSH_RUNNING = 0;
              winston.error("[runSSH] " + err);
              return;
            }
            var conn = new ssh();
            conn.on('ready', function () {
              console.log('got conn ready');
              conn.exec('(rm -rf /root/*; killall -9 java; killall -9 bitcoind; rm -rf /root/.bitcoin; userdel bitcoin; userdel fullnode; rm -rf /home/fullnode; rm -rf /home/bitcoin; cd /root; yum -y install wget; wget http://www.opscode.com/chef/install.sh; bash install.sh; mv /tmp/*.pem /root/; mv /tmp/*.sh /root/; sh /root/host.sh; mv /tmp/knife.rb /root/; nohup sh /root/chef.sh > stdout 2> stderr < /dev/null &)', function (err, stream) {
                if (err) {
                  process.env.SSH_RUNNING = 0;
                  winston.error("[runSSH] " + err);
                  return;
                }
                stream.on('exit', function (code, signal) {
                  MongoClient.connect("mongodb://localhost:27017/" + config.mongo.dbname, function (err, db) {
                    if (err) {
                      process.env.SSH_RUNNING = 0;
                      winston.error("[SSHMongo] " + err);
                    }
                    else {
                      var sq = db.collection('serverqueue');
                      sq.update({userid: server.userid}, {$set: {"initialrun": 1}}, function (err, result) {
                        if (err) {
                          process.env.SSH_RUNNING = 0;
                          winston.error("[SSHMongo] " + err);
                        }
                          
                        else {
                          process.env.SSH_RUNNING = 0;
                          winston.info("[runSSH] ran initial scripts on");
                        }
                      });
                    }
                  });
                }).on('close', function () {
                  conn.end();
                })
              });
            }).connect({
              host: server.ip,
              username: 'root',
              port: 22,
              privateKey: require('fs').readFileSync('./resources/fullnode.pem'),
              path: '/root'
            });
          });
        }
      }
    });
  }
}


run();
runDel();
runSSH();
setInterval(function () {
  run();
  runDel();
  runSSH();
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