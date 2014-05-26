$('#servername').keyup(function () {
  var sname = $(this).val();
  if (!$(this).val()) {
    $('#coinbaseimage').css('opacity', 0.7);
    $('#coinbaseimage').prop('disabled', true);
  }
  else {
    $('.coinbase-button').attr('data-custom', sname);
    $('#coinbaseimage').css('opacity', 1);
    $('#coinbaseimage').prop('disabled', false);
  }
});

$(document).ready(function () {
  $('#coinbaseimage').click(function () {
    $(document).trigger('coinbase_show_modal', '1ec2d26bf6c385c40d2148253d5a4df2');
    return false;
  });

  $(document).on('coinbase_payment_complete', function (event, code) {
    console.log("Payment completed for button " + code);
    window.location = "/?paid=1";
  });
});