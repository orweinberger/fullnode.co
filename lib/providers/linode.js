var logger = require('winston'),
  joola = require('../joola'),
  common = require('../common');

var linode = module.exports;
var client;

exports.init = function(config, callback) {
  client = new (require('linode-api').LinodeClient)(config.apikey);
  callback();
};

exports.provisionServer = function (options, callback) {
  process.env['RUNNING'] = '1';
  logger.info('Provisioning server on Linode');
  client.call('avail.datacenters', {}, function (err, dcs) {
    if (err) return callback(err);
    var dc = dcs[Math.floor(Math.random() * dcs.length)];
    client.call('linode.create', {DatacenterID: dc.DATACENTERID, PlanID: 2, PaymentTerm: 1}, function (err, res) {
      logger.info('calling linode.create');
      if (err) return callback(err);
      var linode_id = res.LinodeID;
      client.call('linode.disk.createfromimage', {LinodeID: linode_id, ImageID: 115411, size: 48640}, function (err, res) {
        logger.info('calling linode.disk.createfromimage');
        var disk_id = res.DISKID;
        if (err) return callback(err);
        client.call('linode.disk.create', {LinodeID: linode_id, Label: "swap", Size: 512, Type: "swap"}, function (err, res) {
          logger.info('calling linode.disk.create');
          var swap_id = res.DiskID;
          if (err) return callback(err);
          client.call('linode.config.create', {LinodeID: linode_id, KernelID: 138, Label: "Fullnode", DiskList: disk_id + "," + swap_id}, function (err, res) {
            logger.info('calling linode.config.create');
            if (err) return callback(err);
            client.call('linode.boot', {LinodeID: linode_id, ConfigID: res.ConfigID}, function (err, res) {
              logger.info('calling linode.boot');
              if (err) return callback(err);
              client.call('linode.ip.list', {LinodeID: linode_id}, function (err, res) {
                logger.info('calling linode.ip.list');
                if (err) return callback(err);
                logger.info('returning final callback');
                process.env['RUNNING'] = '0';
                return callback(null, {"ip": res[0].IPADDRESS, "dc": dc.LOCATION, "serverid": linode_id});
              });
            });
          });
        });
      });
    });
  });
};

exports.deleteServer = function (serverid, callback) {
  logger.warn('deleting server ' + serverid);
  client.call('linode.delete', {"LinodeID": serverid, "skipChecks": "true"}, function (err, res) {
    if (!err)
      return callback(null);
    else
      return callback(err);
  });
};