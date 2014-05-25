var config = require('config').dev;
var joola = require('./lib/joola')
var common = require('./lib/common');
var blockchain = require('./lib/blockchain');
var linode = require('./lib/providers/linode');
var winston = require('winston');
var moment = require('moment');

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();


var total_in_usd;
var coins_to_move;

function queue() {
  blockchain.checkBalance(config.general.hotWalletAddress, function (err, balance) {
    winston.info("checking balance: " + balance);
    if (!err) {
      common.getPrice(function (err, price) {
        winston.info('getting price ' + price)
        if (!err) {
          total_in_usd = Math.floor(parseFloat(price) * parseFloat((balance - 10000) / 100000000));
          coins_to_move = (config.providers.linode.price / parseFloat(price)) * 100000000;
          if (total_in_usd >= config.providers.linode.price) {
            common.queueCoins(coins_to_move, config.general.coldWalletAddress, function (err) {
              winston.info("Coins queued " + coins_to_move);
              if (!err) {
                common.queueServer('linode', function (err) {
                  if (!err) {
                    winston.info("Server queued " + coins_to_move);
                  }
                  else {
                    winston.error("[queueServer] " + err);
                  }
                });
              }
              else
                winston.error("[queueCoins] " + err);
            });
          }
        }
        else
          winston.error("[getPrice] Error! " + err);
      })
    }
    else
      winston.error("[checkBalance] Error! " + err);
  });
}

function run() {
  common.getCoinQueue(function (err, coin) {
    if (coin) {
      blockchain.moveCoins(coin, function (err, res) {
        if (err)
          winston.error("[moveCoins] " + err);
        else {
          winston.info("Moved coins");
          common.dequeueCoins(coin, function (err, res) {
            if (err)
              winston.error("[dequeueCoins] " + err);
            else {
              winston.info("dequeued coins");
              common.getServerQueue(function (err, server) {
                if (err)
                  winston.error("[getServerQueue] " + err);
                else {
                  winston.info("Got server queue");
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
                          joola.beacon(config.joola.collection, {"timestamp": null, "servers": 1, "ipaddress": srv.ip, "dc": srv.dc, "coins_moved": coin.amount, "serverid": srv.serverid}, function (err, doc) {
                            if (err)
                              winston.error("[beacon] " + err);
                            else {
                              winston.info("Pushed data into joola");
                              winston.info(doc);
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
    winston.info("Checking if there are any servers that needs to be deleted")
    if (err)
      winston.error("[checkDelete] " + err);
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/callback', routes.callbackurl);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;


var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});