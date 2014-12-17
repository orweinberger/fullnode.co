$('#goal').text(((20/price - balance)*1000).toFixed(1) + 'mBTC');
setInterval(function () {
  $.get('/data', function (data) {
    $('#goal').text(((20/data.price - data.balance)*1000).toFixed(1) + 'mBTC');
    $('#count').text(data.servers.length);
    var servers = data.servers;
    var tbody = $('<tbody></tbody>');
    servers.forEach(function(server) {
      var tr = $("<tr></tr>");
      $(tr).append("<td>" + moment(server.timestamp).fromNow() + "</td>");
      $(tr).append("<td>" + server.dnsName + '.fullnode.co</td>');
      $(tr).append("<td>" + server.ip + "</td>");
      $(tr).append("<td>" + server.provider + "</td>");
      $(tr).append("<td>" + server.dc + "</td>");
      $(tr).append("<td>" + moment(server.timestamp).add(30, 'days').fromNow() + "</td>");
      $(tbody).append(tr);
    });
    $('.serverlist tbody').remove();
    $('.serverlist').append(tbody);
  });
}, 10000);

$('#loadfaq').on('click', function() {
  $('#faq').modal();
});