var sname;
$('#servername').keyup(function () {
  $('.dnsok').hide();
  $('.dnsfail').hide();
  $('.spinner').show();
  sname = $(this).val();
  if (!$(this).val()) {
    $('.spinner').hide();
    $('.dnsok').hide();
    $('.dnsfail').show();
    $('#setdns').prop('disabled', true);
  }
  else {
    $.post('/dnscheck', {"dns": sname}, function (data, status) {
      $('.spinner').hide();
      $('.dnsfail').hide();
      $('.dnsok').show();
      $('#setdns').prop('disabled', false);
    }).fail(function (data) {
      $('.spinner').hide();
      $('.dnsok').hide();
      $('.dnsfail').show();
      $('#setdns').prop('disabled', true);
    });
  }

});

$('#setdns').on('click', function () {
  var btn = $(this);
  btn.prop('disabled', true);
  $('.errorNotice').hide();
  $.post('/setdns', {"dns": sname, "userid": userid}, function () {
    window.location = "/servers?userid=" + userid;
  }).fail(function (data) {
    var response = JSON.parse(data.responseText);
    $('.errorNotice').text(response.error);
    $('.errorNotice').removeClass('hidden');
    $('.errorNotice').show();
    btn.prop('disabled', false);
  });
})
$(document).ready(function() {
  $('.coinbaselink').click(function(){
    $(document).trigger('coinbase_show_modal', '0b41e454a8d32f1096e8dd90d45d03ff');
    return false;
  });

  $(document).on('coinbase_payment_complete', function(event, code){
    console.log("Payment completed for button "+code);
  });
});


$(document).ready(function() {
  $('.coinbaselinktopup1m').click(function(){
    $(document).trigger('coinbase_show_modal', 'f3117e03000fd2654596763a76f41344');
    return false;
  });

  $(document).on('coinbase_payment_complete', function(event, code){
    console.log("Payment completed for button "+code);
  });
});

$(document).ready(function() {
  $('.coinbaselinktopup6m').click(function(){
    $(document).trigger('coinbase_show_modal', '851c2525c4bc4d9e2a98d25bcea7c052');
    return false;
  });

  $(document).on('coinbase_payment_complete', function(event, code){
    console.log("Payment completed for button "+code);
  });
});

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).on('ready', function () {
  if ($('.servers').length > 0) {
    var userid = getParameterByName('userid');
    $('#' + userid).addClass('highlight');
  }
});