var config = require('config').dev;
var BlockchainWallet = require('blockchain-wallet');
var blockchainWallet = new BlockchainWallet(config.blockchain.id, config.blockchain.password);
var logger = require('winston');

exports.checkBalance = function (address, callback) {
  blockchainWallet.list(function (err, data) {
    if (err)
      return callback(err);
    return callback(null, data.addresses[0].balance);
  });
}

exports.moveCoins = function (options, callback) {
  var toaddress = options.to;
  var amount = options.amount;
  logger.info('moving coins!');
  blockchainWallet.payment(toaddress, Math.floor(amount), {}, function (err, data) {
    logger.info('payment sent!');
    if (err)
      return callback(err);
    return callback(null, data);
  });
}