

$(document).ready(function (e) {
  renderAudioDevices();
  defaults();

  let webRTCHandler = {};
  let ongoingElaspsedTime = null;

  Teravoz.start({
    gatewayCallbacks: {
      success: () => {
        // generic success cb
      },
      error: (err) => {
        // generic error cb
      },
      closed: () => {
        // application ended
      },
      networkState: (obj) => {
        // Networking state
        if (obj.state == 'online') {
          $('#signal').addClass('fa-check');
          $('#signal').removeClass('fa-times');
        } else {
          $('#signal').removeClass('fa-check');
          $('#signal').addClass('fa-times');
        }
      }
    },
    webRTCCallbacks: {
      success: (handler) => {
        webRTCHandler = handler;
        const peer = window.localStorage.getItem('peer');
        const { username, password } = peer && JSON.parse(peer) || {};
        if (username && password) {
          webRTCHandler.register({ username, password });
        } else {
          $('.login').removeClass('remove');
        }
        $('#make-call').click(makeCall);
        $('#hangup').click(hangup);
        $('#register').click(register);
        $('#unregister').click(unregister);
      },
      error: (err) => {
        // We may use dialogs for displaying errors
      },
      registrationFailed: () => {
        // Failed to register sip account
        alert('registration failed')
      },
      registering: () => {
        // We may implement a loader
      },
      registered: () => {
        // sip account logged in
        const peer = window.localStorage.getItem('peer');
        const { username } = peer && JSON.parse(peer) || {};
        $('.contact-number').text(`Registered as peer ${username}`);
        if ($('.dial-pad').hasClass('remove')) {
          $('.login').addClass('remove');
          $('.dial-pad').removeClass('remove');
        }
      },
      calling: () => {
        // We may do something when the destination is ringing
        $('.call-status').html(`Calling ${$('#exten').val()}...`);
        MicroModal.show('modal-only');
      },
      incomingCall: (obj) => {
        // Receiving a call...
        // accept or decline...
        ongoingCallWith = obj.from;
        $('#incoming-call-text').html(`Incoming call from ${obj.from}`);
        $('#accept-call').click(function(e) {
          obj.actions.accept();
          $('.call-status').html(`Ongoing call with ${obj.from}`);
        })
        $('#decline-call').click(function(e) {
          obj.actions.decline();
        });
        MicroModal.show('modal-incoming-call');
      },
      earlyMedia: () => {
        // We are receiving the carrier early media...
      },
      acceptedCall: () => {
        // Once the call is accepted...
        $('.call-status').html(`Ongoing call with ${$('#exten').val()}`);
        $('.call-info').append('<span class="call-status-timer"></span>');
        let elapsedTime = 0;
        
        ongoingElaspsedTime = setInterval(() => {
          elapsedTime++;
          const time = getElapsedTime(elapsedTime)
          $('.call-status-timer').html(time);
        }, 1000);

        $('#hangup').removeClass('invisible');
        $('#make-call').addClass('invisible');
      },
      hangingUp: () => {
        // Hanging up the call
      },
      hangup: () => {
        // Got a hangup event from any side
        if (ongoingElaspsedTime) {
          clearInterval(ongoingElaspsedTime);
          $('.call-status-timer').remove();
          $('.call-status').html('Available');
        }
        $('#make-call').removeAttr('disabled').click(makeCall);
        $('#hangup').addClass('invisible');
        $('#make-call').removeClass('invisible');
        $('#exten').val('');
        defaults();
      },
      webRTCState: () => {
        // Checking WebRTC state.
      },
      blockingEvent: (block) => {
        // Received blocking event such as microphone usage permission popup.
      },
      isReceivingMedia: () => {
        // We are receiving the audio
        MicroModal.close('modal-only');
      },
      DTMF: (obj) => {
        // The call is already going on, so that the DTMF is active
        // Once you click on the numbers
        $('.number-dig').click(function (e) {
          const tone = $(this).data().digit;
          if (tone) {
            obj.sendTones(tone);
          }
        });

        // Notice that exten is the input, so that we want to
        // trigger the keyboard event on dtmf
        $('#exten').keyup(function(e) {
          let shifting = e.shiftKey;
          if (isDialpadValidChar(e.charCode, shifting)) {
            obj.sendTones(String.fromCharCode(e.charCode));
          }
        });
      },
      cleanup: () => {
        // Ended calls get cleanups
      },
    }
  }, { // Provide the html stream elements
    localStream: $('#local').get(0),
    remoteStream: $('#remote').get(0)
  });

  function register() {
    const username = $('#username').val();
    const password = $('#password').val();
    const remember = $('#remember')[0].checked;
    if (remember) {
      window.localStorage.setItem('peer', JSON.stringify({ username, password }));
    }
    $('.error-username').addClass('hidden');
    $('.error-password').addClass('hidden');
    if (!username || username.length == 1) {
      $('.error-username').removeClass('hidden').html('The username is required');
      return;
    }
    if (!password || password.length == 1) {
      $('.error-password').removeClass('hidden').html('The password is required');
      return;
    }
    $(this).attr('disabled', false);

    webRTCHandler.register({ username, password });
  }

  function unregister() {
    webRTCHandler.unregister();
    window.localStorage.removeItem('peer');

    $('.dial-pad').addClass('remove');
    $('.login').removeClass('remove');
  }

  function makeCall() {
    $('#hangup').removeClass('invisible');
    $(this).addClass('invisible');
    webRTCHandler.dial({ 
      numberTo: $('#exten').val(),
      error: () => {
        $('#hangup').addClass('invisible');
        $(this).removeClass('invisible');
      }
    });
  }

  function hangup() {
    if (ongoingElaspsedTime) {
      clearInterval(ongoingElaspsedTime);
    }
    $('.call-status').html('Available');
    $('.call-status-timer').remove();
    $('#make-call').removeClass('invisible').attr('disabled', true).unbind('click');
    $('#hangup').addClass('invisible');
    webRTCHandler.hangup();
  }


  function isDialpadValidChar(code, shifting) {
    if (shifting) {
      if (code == 51 || code == 56) {
        return true;
      }
      return false;
    }

    return code == 35 || code == 42 || (code >= 48 && code <= 57);
  }

  function dialpadInputDtmf(dtmf) {
    return function (e) {
      let shifting = e.shiftKey;
      if (isDialpadValidChar(e.charCode, shifting)) {
        dtmf.sendTones(String.fromCharCode(e.charCode));
      }
    }
  }

  function dialInputDefault(e) {
    let shifting = e.shiftKey;
    if (e.keyCode != 8 && !isDialpadValidChar(e.keyCode, shifting)) {
      e.preventDefault();
    }
  }

  function defaults() {
    // Allow only the dialpad values.
    $('#exten').on('keydown keyup', dialInputDefault);

    $('.go-back').click(function () {
      $('.tools').addClass('remove');
      $('.login').addClass('remove');
      $('.dial-pad').removeClass('remove');
    });
    $('.settings').click(function () {
      $('.login').addClass('remove');
      $('.dial-pad').addClass('remove');
      $('.tools').removeClass('remove');
    });

    $('.peer').click(function () {
      unregister()
    });

    $('.number-dig').click(function (e) {
      let exten = $('#exten').val();
      let digit = $(this).data().digit;
      let newValue = exten + digit;
      $('#exten').focus();
      if (!isDialpadValidChar(digit.toString().charCodeAt(0)), e.shiftKey) {
        e.preventDefault();
        return;
      }
      $('#exten').val(newValue);
    });
  }
});

function renderAudioDevices() {
  Teravoz.getAudioDevices().then(function ({ input, output }) {
    for (let i = 0; i < input.length; i++) {
      const option = document.createElement('option');
      option.value = input[i].deviceId;
      option.text = input[i].label || `Microphone ${i + 1}`;
      option.selected = input[i].deviceId == 'default';
      $('#input-settings').append(option);
    }
    for (let i = 0; i < output.length; i++) {
      const option = document.createElement('option');
      option.value = output[i].deviceId;
      option.text = output[i].label || `Sound ${i + 1}`;
      option.selected = output[i].deviceId == 'default';
      $('#output-settings').append(option);
    }
  }).catch(function (error) {
    alert('Error: ' + error.message);
  })
}

function addPadding(num) {
  return (num < 10 ? '0' : '') + num;
}

function getElapsedTime(secs) {
  const hours = Math.floor(secs / 3600);
  secs = secs % 3600;
  const minutes = Math.floor(secs / 60);
  secs = secs % 60;
  const seconds = Math.floor(secs);

  const currentTimeString = addPadding(hours) + ":" + addPadding(minutes) + ":" + addPadding(seconds);

  return currentTimeString;
}


