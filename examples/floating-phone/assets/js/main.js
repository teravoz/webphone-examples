const button = document.querySelector('.tel-box__button');
const box = document.querySelector('.tel-box');
const phoneNumber = document.getElementById('phone-number');
const timer = document.getElementById('timer');
const acceptButton = document.querySelector('.call-box__accept');
const declineButton = document.querySelector('.call-box__decline');
const callButton = document.querySelector('.tel-box__call');
const hangupButton = document.querySelector('.tel-box__hangup');
const exten = document.getElementById('exten');
const actionButton = document.querySelector('.fa-phone');
const callBox = document.querySelector('.call-box');
const ongoingcallBox = document.querySelector('.ongoing-call-box');
const hangupButtonOngoing = document.querySelector('.ongoing-call-box__hangup');


const microphone = document.querySelector('.microphone');
const microphoneIcon = document.getElementById('microphone-control');

const volumeIcon = document.getElementById('audio-control');
const volume = document.querySelector('.audio-mute');

class Webphone {

  constructor() {
    this.teravoz = {};

    this.incomingInterval = null;
    this.ongoingTime = null;
    this.muted = false;

    this.setGatewayCallbacks();
    this.setWebRTCCallbacks();
    this.setStreams();
  }

  setGatewayCallbacks() {
    const gatewayCallbacks = {
      success: function () {

      },
      error: function (error) {

      },
      closed: function () {

      },
      networkState: function () {

      }
    };

    this.gatewayCallbacks = gatewayCallbacks;
  }

  setStreams() {
    this.streams = {
      localStream: document.getElementById('local'),
      remoteStream: document.getElementById('remote')
    };
  }

  setWebRTCCallbacks() {
    var self = this;
    const webRTCCallbacks = {
      success: function (instance) {
        self.teravoz = instance;

        // login with peer...
        self.teravoz.register({ username: 'YOUR-LOGIN', password: 'YOUR-PASSWORD' });

        // registering the button callbacks
        callButton.addEventListener('click', (e) => self.call());
        hangupButton.addEventListener('click', (e) => self.hangup());
        hangupButtonOngoing.addEventListener('click', (e) => self.hangup());
        exten.addEventListener('keyup', self.validateInput.bind(self));
        exten.addEventListener('keydown', self.validateInput.bind(self));
        microphone.addEventListener('click', (e) => {
          if (this.muted) {
            self.teravoz.unmute();
            this.muted = false;
            microphoneIcon.classList.remove('fa-microphone-slash');
            microphoneIcon.classList.add('fa-microphone');
            return;
          }
          microphoneIcon.classList.remove('fa-microphone');
          microphoneIcon.classList.add('fa-microphone-slash');
          self.teravoz.mute();
          this.muted = true;
        });
      },
      error: function (error) {

      },
      registering: function () {

      },
      registered: function () {
        button.removeAttribute('disabled');
      },
      registrationFailed: function () {

      },
      calling: function () {

      },
      incomingCall: function ({ theirNumber, actions }) {
        self.incomingInterval = setInterval(() =>
          box.classList.toggle('tel-box--incoming'),
          1000);

        callBox.classList.toggle('call-box--active');
        button.toggleAttribute('disabled');

        // Adding the number to screen
        phoneNumber.innerHTML = '' + theirNumber;

        // Adding click to actions 
        acceptButton.addEventListener('click', (e) => {
          callBox.classList.toggle('call-box--active');
          ongoingcallBox.classList.toggle('ongoing-call-box--active');
          actions.accept();
        });

        declineButton.addEventListener('click', (e) => {
          callBox.classList.toggle('call-box--active');
          actions.decline();
        });
      },
      earlyMedia: function () {

      },
      acceptedCall: function (som) {
        let elapsedTime = 0;
        self.ongoingTime = setInterval(() => {
          elapsedTime++;
          const time = self.getElapsedTime(elapsedTime);
          timer.innerText = time;
        }, 1000);

        if (self.incomingInterval) {
          clearInterval(self.incomingInterval);
          box.classList.toggle('tel-box--incoming')
        }
      },
      missedCall: function () {

      },
      hangingUp: function () {

      },
      hangup: function () {
        if (self.incomingInterval) {
          clearInterval(self.incomingInterval);
          box.classList.toggle('tel-box--incoming')
        }

        if (callBox.classList.contains('call-box--active')) {
          callBox.classList.toggle('call-box--active');
        }

        if (ongoingcallBox.classList.contains('ongoing-call-box--active')) {
          ongoingcallBox.classList.toggle('ongoing-call-box--active');
        }

        button.toggleAttribute('disabled');
        timer.innerText = "";

        if (callButton.classList.contains('none')) {
          callButton.classList.remove('none');
          hangupButton.classList.add('none');
        }
      },
      webRTCState: function () {

      },
      DTMF: function (payload) {
        exten.addEventListener('keydown', (e) => {
          if (!self.validateInput(e)) {
            return;
          }
          payload.sendTones(e.key);
        });
      },
      isReceivingMedia: function () {

      },
      cleanup: function () {
        if (self.incomingInterval) {
          clearInterval(self.incomingInterval);
        }
        if (self.ongoingTime) {
          clearInterval(self.ongoingTime);
        }

        timer.innerText = "";
      },
    };

    this.webRTCCallbacks = webRTCCallbacks;
  }

  call() {
    if (exten.value) {
      this.teravoz.dial({
        numberTo: exten.value,
        error: (error) => {
          if (callButton.classList.contains('none')) {
            callButton.classList.remove('none');
            hangupButton.classList.add('none');
          }
        }
      });

      if (hangupButton.classList.contains('none')) {
        callButton.classList.add('none');
        hangupButton.classList.remove('none');
      }
    }
  }

  hangup() {
    this.teravoz.hangup();
    if (callButton.classList.contains('none')) {
      callButton.classList.remove('none');
      hangupButton.classList.add('none');
    }

    if (ongoingcallBox.classList.contains('ongoing-call-box--active')) {
      ongoingcallBox.classList.toggle('ongoing-call-box--active');
    }
  }

  validateInput(e) {
    const valid = this.isDialpadValidChar(e.key);
    if (!valid) {
      e.preventDefault();
      return false;
    }

    return true;
  }

  isDialpadValidChar(key) {

    switch(key) {
      case '#':
      case '*':
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0':
      case 'Backspace':
        return true;
    }
  }

  addPadding(num) {
    return (num < 10 ? '0' : '') + num;
  }

  getElapsedTime(secs) {
    const hours = Math.floor(secs / 3600);
    secs = secs % 3600;
    const minutes = Math.floor(secs / 60);
    secs = secs % 60;
    const seconds = Math.floor(secs);

    const currentTimeString = this.addPadding(hours) + ":" + this.addPadding(minutes) + ":" + this.addPadding(seconds);

    return currentTimeString;
  }
}


window.addEventListener('load', (e) => {

  button.addEventListener('click', () => {
    box.classList.toggle('tel-box--active');
  });


  const webphone = new Webphone();
  Teravoz.start({
    gatewayCallbacks: webphone.gatewayCallbacks,
    webRTCCallbacks: webphone.webRTCCallbacks
  }, webphone.streams);
});