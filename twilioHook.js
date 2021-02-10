const VoiceResponse = require('twilio').twiml.VoiceResponse;

const { vaccineMachine, getStateForSession, saveStateForSession, deleteStateForSession } = require('./vaccineMachine');

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

  const state = vaccineMachine.transition(currentState, {type: userEvent, Digits});

  console.log(`After ${userEvent} the state is now ${state.value} with context being ${JSON.stringify(state.context)}`);

  saveStateForSession(CallSid, state);

  const twiml = new VoiceResponse();

  if (state.matches('welcome')) {
    twiml.say({voice: defaultVoice}, `Hi! Thank you for calling the “Vaccination Help Line”.`);
    twiml.say({voice: defaultVoice}, `We're here to help you schedule your vaccination appointment. While this line is automated, we will connect you to a volunteer who will reach out to you.`);

      // Snip off +1 from US phone numbers.
    const formatted = From.length === 12 ? From.substring(2) : From;
    twiml.say({voice: defaultVoice}, `Is the following the number the right phone number you would like us to dial? ${formatted.split('').join(' ')}?`);
    const gather = twiml.gather({numDigits: 1, timeout: 60});
    gather.say({voice: defaultVoice}, 'Press 1 to “accept” or press 2 to “enter a different number”, or press 3 to “repeat” this option.');
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('numberInput')) {
    twiml.say({voice: defaultVoice}, `Please type in your number followed by a pound sign.`);
    twiml.gather({finishOnKey: '#', timeout: 60});
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('numberInputConfirm')) {
    twiml.say({voice: defaultVoice}, `You typed in ${state.context.phone.split('').join(' ')}. Is that correct?`);
    const gather = twiml.gather({numDigits: 1, timeout: 60});
    gather.say({voice: defaultVoice}, 'Press 1 to confirm. Press 2 to enter a new callback number. Press 3 to repeat.');
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('zipCodeInput')) {
    twiml.say({voice: defaultVoice}, `Thank you! Now enter your zip-code.`);
    twiml.gather({numDigits: 5, timeout: 60});
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('zipCodeInputConfirm')) {
    twiml.say({voice: defaultVoice}, `You entered, ${state.context.zipCode.split('').join(' ')}. Is that correct?`);
    const gather = twiml.gather({numDigits: 1, timeout: 60});
    gather.say({voice: defaultVoice}, 'Press 1 to confirm or 2 to erase and re-enter the zip-code. Press 3 to repeat.');
    twiml.say({voice: defaultVoice}, 'We did not receive any input. Please call back and try again.');
  } else if (state.matches('voicemail')) {
    twiml.say({voice: defaultVoice}, 'Thank you. A volunteer will reach out to you shortly. After the tone, please say your name. When you are finished recording, please press the pound or star key, or you can hang up.');
    twiml.record({finishOnKey: '#', playBeep: true, maxLength: 600, timeout: 60});
  } else if (state.matches('hangup')) {
    twiml.say({voice: defaultVoice}, 'We’ve received your message. A volunteer will reach out soon. Thank you, and good bye!');
    twiml.hangup();

    // Write to airtable
    // TODO: Make Table name and base configurable
    // We could use the Metadata API to configure the perfect airtable table automatically
    base('People').create([
        {
          "fields": {
            Phone: state.context.phone || From,
            Voicemail: [{
              url: RecordingUrl,
            }],
            Zip: state.context.zipCode,
          },
        },
      ])
      .then((result) => {
        console.log('Saved to airtable', result);
      })
      .catch(e => {
        console.error('Saving to airtable failed', e.toString());
      });
    deleteStateForSession(CallSid);
  } else {
    throw new Error('We should not ever get here lol');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.write(twiml.toString());
  res.end();
}

module.exports = twilioHook;
