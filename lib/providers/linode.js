var config = require('config').dev;
var client = new (require('linode-api').LinodeClient)(config.providers.linode.apikey);
var logger = require('winston');
var joola = require('../joola');
var common = require('../common');

exports.provisionServer = function (options, callback) {
  logger.info('in provision function');
  client.call('avail.datacenters', {}, function (err, dcs) {
    if (!err) {
      var dc = dcs[Math.floor(Math.random() * dcs.length)];
      client.call('linode.create', {DatacenterID: dc.DATACENTERID, PlanID: 1, PaymentTerm: 1}, function (err, res) {
        logger.info('calling linode.create');
        if (!err) {
          var linode_id = res.LinodeID;
          client.call('linode.disk.createfromstackscript', {LinodeID: linode_id, StackScriptID: 8878, StackScriptUDFResponses: {}, DistributionID: 127, Label: "fullnode", Size: 48640, rootPass: config.providers.linode.rootpass}, function (err, res) {
            logger.info('calling linode.disk.createfromstackscript');
            var disk_id = res.DiskID;
            if (!err) {
              client.call('linode.disk.create', {LinodeID: linode_id, Label: "swap", Size: 512, Type: "swap"}, function (err, res) {
                logger.info('calling linode.disk.create');
                var swap_id = res.DiskID;
                if (!err) {
                  client.call('linode.config.create', {LinodeID: linode_id, KernelID: 165, Label: "Fullnode", DiskList: disk_id + "," + swap_id}, function (err, res) {
                    logger.info('calling linode.config.create');
                    if (!err) {
                      client.call('linode.boot', {LinodeID: linode_id, ConfigID: res.ConfigID}, function (err, res) {
                        logger.info('calling linode.boot');
                        if (!err) {
                          client.call('linode.ip.list', {LinodeID: linode_id}, function (err, res) {
                            logger.info('calling linode.ip.list');
                            if (!err) {
                              logger.info('returning final callback');
                              //common.setDNS(options.dns, res[0].IPADDRESS, function (err) {
                                //if (!err)
                                  return callback(null, {"ip": res[0].IPADDRESS, "dc": dc.LOCATION, "serverid": linode_id});
                                //else
                                  //return callback(err);
                              //});

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
    else
      return callback(err);
  });
}


exports.deleteServer = function (serverid, callback) {
  serverid = serverid.serverid;
  logger.warn('deleting ' + serverid);

  client.call('linode.delete', {"LinodeID": serverid}, function (err, res) {
    if (!err)
      return callback(null)
    else
      return callback(err);
  });

}