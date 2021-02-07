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

const twilioHook = (req, res) => {
  console.log(req.body);

  const {
    CallSid, From, RecordingUrl, Digits
  } = req.body;

  const currentState = getStateForSession(CallSid);
  const userEvent = getEvent(Digits);

  console.log(`Current state is ${currentState.value}`);

  const state = vaccineMachine.transition(currentState, {type: userEvent, From, Digits});

  console.log(`After ${userEvent} the state is now ${state.value} with context being ${JSON.stringify(state.context)}`);

  saveStateForSession(CallSid, state);

  const twiml = new VoiceResponse();

  if (state.matches('welcome')) {
    twiml.say({voice: defaultVoice}, `Is your number ${From}?`);
    const gather = twiml.gather({numDigits: 1, timeout: 60});
    gather.say({voice: defaultVoice}, 'Press 1 to confirm. Press 2 to enter a different callback number. Press 3 to repeat.');
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('numberInput')) {
    twiml.say({voice: defaultVoice}, `Please type in your number followed by a pound sign.`);
    twiml.gather({finishOnKey: '#', timeout: 60});
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('numberInputConfirm')) {
    twiml.say({voice: defaultVoice}, `You typed in ${state.context.phone}. Is that correct?`);
    const gather = twiml.gather({numDigits: 1, timeout: 60});
    gather.say({voice: defaultVoice}, 'Press 1 to confirm. Press 2 to enter a new callback number. Press 3 to repeat.');
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('voicemail')) {
    twiml.say({voice: defaultVoice}, 'Thank you. We have your number. Please leave a message after the beep');
    twiml.record({finishOnKey: '#'});
  } else if (state.matches('hangup')) {
    twiml.say({voice: defaultVoice}, 'Thank you. We will get back to you');
    twiml.hangup();

    // Write to airtable
    // TODO: Make Table name configurable
    // We could use the Metadata API to configure the perfect airtable table automatically
    base('Table 1').create([
        {
          "fields": {
            Phone: state.context.phone || From,
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
