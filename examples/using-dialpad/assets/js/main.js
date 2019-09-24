

$(document).ready(function (e) {
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
      }
    },
    webRTCCallbacks: {
      success: (handler) => {
        webRTCHandler = handler;
        const peer = window.localStorage.getItem('peer');
        const { username, password } = peer && JSON.parse(peer) || {};
        if (username && password) {
          webRTCHandler.register(username, password);
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
      incomingCall: (theirNumber, actions) => {
        // Receiving a call...
        // accept or decline...
        ongoingCallWith = theirNumber;
        $('#incoming-call-text').html(`Incoming call from ${theirNumber}`);
        $('#accept-call').click(function(e) {
          actions.accept();
          $('.call-status').html(`Ongoing call with ${theirNumber}`);
        })
        $('#decline-call').click(function(e) {
          actions.decline();
        });
        MicroModal.show('modal-incoming-call');
      },
      earlyMedia: (theirNumber) => {
        // We are receiving the carrier early media...
      },
      acceptedCall: (theirNumber, payload) => {
        // Once the call is accepted...
        $('.call-status').html(`Ongoing call with ${$('#exten').val()}`);
        $('.call-info').append('<span class="call-status-timer"></span>');
        let elapsedTime = 0;

        /* If you had provided a callId on the dial event, 
         * then the same callId will be returned as a property of the second parameter
         * of this function. Otherwise, it will still be present, but as a random callId, also generated on dial */
        console.log(`[${payload.callId}] Call accepted`);
        
        ongoingElaspsedTime = setInterval(() => {
          elapsedTime++;
          const time = getElapsedTime(elapsedTime)
          $('.call-status-timer').html(time);
        }, 1000);

        $('#hangup').removeClass('invisible');
        $('#make-call').addClass('invisible');
      },
      hangingUp: (payload) => {
        // Hanging up the call
        console.log(`[${payload.callId}] Hanging up...`)
      },
      hangUp: (payload) => {
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

        console.log(`[${payload.callId}] Hangup up`)
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
      DTMF: () => {
        // The call is already going on, so that the DTMF is active
        // Once you click on the numbers
        $('.number-dig').click(function (e) {
          const tone = $(this).data().digit;
          if (tone) {
            webRTCHandler.sendDTMF(tone);
          }
        });

        // Notice that exten is the input, so that we want to
        // trigger the keyboard event on dtmf
        $('#exten').keyup(function(e) {
          let shifting = e.shiftKey;
          if (isDialpadValidChar(e.charCode, shifting)) {
            webRTCHandler.sendDTMF(String.fromCharCode(e.charCode))
          }
        });
      },
      cleanUp: () => {
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

    webRTCHandler.register(username, password);
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
    webRTCHandler.on('sendDTMFSuccess', () => console.log('dialSuccess'));
    webRTCHandler.on('sendDTMFError', (reason) => {
      console.log(reason);
    });

    const callbacks = {
      success: () => console.log(`SUCCESS: Dial to ${$('#exten').val()}`),
      error: (err) => console.error(`Error: Dial to ${$('#exten').val()}: ${err}`),
    }

    // It has to be a string
    const generatedCallId = `${Date.now()}`;

    /* You can pass a client side generated call ID to the dial method
     * as an optional third parameter. This parameter will be used as a code in Teravoz 
     * webhook events, so you can use this code to identify the call.
     * 
     * If the call ID isn't manual provided, then it will be generated automatically, but 
     * the code field will NOT be present on teravoz webhooks
     */
    webRTCHandler.dial($('#exten').val(), callbacks, generatedCallId);
  }

  function hangup() {
    if (ongoingElaspsedTime) {
      clearInterval(ongoingElaspsedTime);
    }
    $('.call-status').html('Available');
    $('.call-status-timer').remove();
    $('#make-call').removeClass('invisible').attr('disabled', true).unbind('click');
    $('#hangup').addClass('invisible');
    webRTCHandler.hangUp();
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
        
        webRTCHandler.sendDTMF(String.fromCharCode(e.charCode))
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


