if (process.env.NODE_ENV == 'production') {
  var config = require('config').prod;
}
else
  var config = require('config').dev;
var logger = require('winston');
var joola = require('../joola');
var common = require('../common');
var DigitalOceanAPI = require('digitalocean-api');
var api = new DigitalOceanAPI(config.providers.digitalocean.clientid, config.providers.digitalocean.apikey);
exports.provisionServer = function (options, callback) {
  process.env['RUNNING'] = '1';
  var uuid = common.uuid();
  var regionName;
  api.regionGetAll(function (err, regions) {
    if (err)
      return callback(err);
    var location = regions[Math.floor(Math.random() * regions.length)];
    api.dropletNew(uuid, 63, 4401958, location.id, {}, function (error, droplets) {
      if (error)
        return callback(err);
      api.eventGet(droplets.event_id, function (err, event) {
        if (err)
          return callback(err);
        var serverInterval = setInterval(function () {
          api.dropletGet(event.droplet_id, function (err, data) {
            if (err)
              return callback(err)
            if (data.ip_address) {
              clearInterval(serverInterval);
              regions.forEach(function (r) {
                if (r.id === location.id)
                  regionName = r.name;
              });
              data.droplet_id = event.droplet_id;
              data.region_name = regionName;
              process.env['RUNNING'] = '0';
              return callback(null, data);
            }
          });
        }, 5000);
      });
    });
  });
};