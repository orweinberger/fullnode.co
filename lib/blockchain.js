var options = require('../config.js');
var BlockchainWallet = require('blockchain-wallet');
var blockchainWallet = new BlockchainWallet(options.blockchainID, options.blockchainPassword);

exports.checkBalance = function (address, callback) {
  blockchainWallet.list(function (err, data) {
    if (err)
      return callback(err);
    return callback(null, data.addresses[0].balance);
  });
}

exports.moveCoins = function (toaddress, amount, callback) {
  console.log('moving coins!');
  blockchainWallet.payment(toaddress, Math.floor(amount), {}, function (err, data) {
    console.log('payment sent!');
    if (err)
      return callback(err);
    return callback(null, data);
  });
}