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
  $.post('/setdns', {"dns": sname, "userid": userid}, function () {
    window.location = "/servers?userid=" + userid;
  }).fail(function (data) {
    console.log("error", data);
  });
})

$(document).ready(function () {
  $('#coinbaseimage').click(function () {
    var button = $(this);
    $('iframe').remove();
    $(button).prop('disabled', true);
    $('body').append('<iframe src="https://coinbase.com/buttons/1ec2d26bf6c385c40d2148253d5a4df2/widget?code=1ec2d26bf6c385c40d2148253d5a4df2&buttonStyle=none&custom=' + uuid + '" id="coinbase_modal_iframe_1ec2d26bf6c385c40d2148253d5a4df2" name="coinbase_modal_iframe_1ec2d26bf6c385c40d2148253d5a4df2" style="background-color: transparent; border: 0px none transparent; overflow: hidden; display: none; position: fixed; visibility: visible; margin: 0px; padding: 0px; left: 0px; top: 0px; width: 100%; height: 100%; z-index: 9999;" scrolling="no" allowtransparency="true" frameborder="0"></iframe>');
    $('<div class="modal-backdrop" style="opacity:0.7"></div>').appendTo(document.body);
    setTimeout(function () {
      $('.modal-backdrop').remove();
      $(document).trigger('coinbase_show_modal', '1ec2d26bf6c385c40d2148253d5a4df2');
      $(button).prop('disabled', false);
      return false;
    }, 1500);
  });

  $(document).on('coinbase_payment_complete', function (event, code) {
    setTimeout(function () {
      window.location = "/dns/" + uuid;
    }, 1000);

  });
});