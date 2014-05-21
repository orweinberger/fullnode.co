var linode = require('./lib/providers/linode');

linode.deleteServer("535553", function(err) {
  console.log(err);
})