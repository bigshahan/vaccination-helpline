const VoiceResponse = require('twilio').twiml.VoiceResponse;

const { vaccineMachine, getStateForSession, saveStateForSession } = require('./vaccineMachine');

const config = require('./config');

const Airtable = require('airtable');
Airtable.configure({ apiKey: config.AIRTABLE_API_KEY })
const base = Airtable.base('appSneAc22kTn1k7l');
const defaultVoice = 'Polly.Joanna-Neural';

const getEvent = (digits) => {
  switch (digits) {
    case '1':
      return 'PRESS_ONE';
    case '2':
      return 'PRESS_TWO';
    case '3':
      return 'PRESS_THREE';
    default:
      return 'PRESS_POUND';
  }
};

// Store
const sidToPhone = {};

const twilioHook = (req, res) => {
  console.log(req.body);

  const {
    CallSid, From, RecordingUrl, Digits
  } = req.body;

  const currentState = getStateForSession(CallSid);
  const userEvent = getEvent(Digits);

  console.log(`Current state is ${currentState.value}`);

  const state = vaccineMachine.transition(currentState, userEvent);

  console.log(`After ${userEvent} the state is now ${state.value}`);

  saveStateForSession(CallSid, state);

  const twiml = new VoiceResponse();

  if (!sidToPhone[CallSid]) {
    sidToPhone[CallSid] = From;
  }

  if (state.matches('welcome')) {
    twiml.say({voice: defaultVoice}, `Is your number ${From}? Press 1 if yes, 2 if no, 3 to repeat.`);
    twiml.gather({numDigits: 1});
    // twiml.say({voice: defaultVoice}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('numberInput')) {
    twiml.say({voice: defaultVoice}, `Please type in your number followed by a pound sign.`);
    twiml.gather({finishOnKey: '#'});
    // twiml.say({voice: defaultVoice}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('numberInputConfirm')) {
    sidToPhone[CallSid] = Digits
    twiml.say({voice: defaultVoice}, `You typed in ${Digits}. Is that correct? Press 1 if yes, press 2 if no, press 3 to repeat.`);
    twiml.gather({numDigits: 1, /* action: `/v1/twilio/hook?input=_____` or store number in xstate? */});
    // twiml.say({voice: defaultVoice}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('voicemail')) {
    twiml.say({voice: defaultVoice}, 'Thank you. We have your number. Please leave a message after the beep');
    twiml.record({finishOnKey: '#'});
  } else if (state.matches('hangup')) {
    // Pull phone number out of state context or use the From variable that twilio provides
    twiml.say({voice: defaultVoice}, 'Thank you. We will get back to you');
    twiml.hangup();

    // Write to airtable
    // TODO: Make Table name configurable
    // We could use the Metadata API to configure the perfect airtable table automatically
    base('Table 1').create([
        {
          "fields": {
            Phone: sidToPhone[CallSid],
            Voicemail: [{
              url: RecordingUrl,
            }],
          },
        },
      ])
      .then((result) => {
        console.log('Saved to airtable', result);
      })
      .catch(e => {
        console.error('Saving to airtable failed', e.toString());
      });

  } else {
    throw new Error('We should not ever get here lol');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.write(twiml.toString());
  res.end();
}

module.exports = twilioHook;
