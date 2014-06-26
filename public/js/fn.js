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
  console.log('ready');
  $('.coinbaselink').click(function(){
    console.log('clicked');
    $(document).trigger('coinbase_show_modal', 'beaf806da0e6de66bf452546a076d172');
    return false;
  });

  $(document).on('coinbase_payment_complete', function(event, code){
    console.log("Payment completed for button "+code);
    //window.location = "/confirmation.html";
  });
});
/*
 $(document).ready(function () {
 $('#coinbaseimage').click(function () {
 var button = $(this);
 $('iframe').remove();
 $(button).prop('disabled', true);
 $('body').append('<iframe src="https://coinbase.com/buttons/189c809b3f648377403985108a166827/widget?code=189c809b3f648377403985108a166827&buttonStyle=none&custom=' + uuid + '" id="coinbase_modal_iframe_189c809b3f648377403985108a166827" name="coinbase_modal_iframe_189c809b3f648377403985108a166827" style="background-color: transparent; border: 0px none transparent; overflow: hidden; display: none; position: fixed; visibility: visible; margin: 0px; padding: 0px; left: 0px; top: 0px; width: 100%; height: 100%; z-index: 9999;" scrolling="no" allowtransparency="true" frameborder="0"></iframe>');
 $('<div class="modal-backdrop" style="opacity:0.7"></div>').appendTo(document.body);
 setTimeout(function () {
 $('.modal-backdrop').remove();
 $(document).trigger('coinbase_show_modal', '189c809b3f648377403985108a166827');
 $(button).prop('disabled', false);
 return false;
 }, 1500);
 });


 });
 */

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