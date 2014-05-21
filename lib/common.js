var https = require("https");

exports.getPrice = function(callback) {
    var url = "https://www.bitstamp.net/api/ticker/";
    var request = https.get(url, function (response) {
      var buffer = "",
        data,
        route;

      response.on("data", function (chunk) {
        buffer += chunk;
      });

      response.on("end", function (err) {
        try {
          data = JSON.parse(buffer);
        } catch (e) {
          return callback(e)
        }

        if (!err)
          if (data && data.last && data.last > 0)
            return callback(null, data.last);
          else
            return callback('data error');
        else
          return callback(err)
      });
    });
}