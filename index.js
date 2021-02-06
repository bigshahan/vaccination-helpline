const VoiceResponse = require('twilio').twiml.VoiceResponse;

const { urlencoded } = require('body-parser');
const express = require('express');
const config = require('./config');
const { vaccineMachine, getStateForSession, saveStateForSession } = require('./vaccineMachine');

const app = express();
app.use(urlencoded({ extended: false }));

const PORT = config.PORT;

app.get('/', (req, res) => res.send('💉🌎🌍🌏'));

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

app.post('/v1/twilio/hook', (req, res) => {
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

  if (state.matches('welcome')) {
    twiml.say({voice: 'alice'}, `Is your number ${From}? Press 1 if yes, 2 if no, 3 to repeat.`);
    twiml.gather({numDigits: 1});
    // twiml.say({voice: 'alice'}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('numberInput')) {
    twiml.say({voice: 'alice'}, `Please type in your number followed by a pound sign.`);
    twiml.gather({finishOnKey: '#'});
    // twiml.say({voice: 'alice'}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('numberInputConfirm')) {
    twiml.say({voice: 'alice'}, `You typed in ${Digits}. Is that correct? Press 1 if yes, press 2 if no, press 3 to repeat.`);
    twiml.gather({numDigits: 1, /* action: `/v1/twilio/hook?input=_____` or store number in xstate? */});
    // twiml.say({voice: 'alice'}, 'We could not process your request. Please call back and try again.');
    // twiml.hangup();
  } else if (state.matches('voicemail')) {
    twiml.say({voice: 'alice'}, 'Thank you. We have your number. Please leave a message after the beep');
    twiml.record({finishOnKey: '#'});
  } else if (state.matches('hangup')) {
    // Write to airtable
    twiml.say({voice: 'alice'}, 'Thank you. We will get back to you');
    twiml.hangup();
  } else {
    throw new Error('We should not ever get here lol');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.write(twiml.toString());
  res.end();
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
