const VoiceResponse = require('twilio').twiml.VoiceResponse;

const { urlencoded } = require('body-parser');
const express = require('express');
const config = require('./config');
const { vaccineMachine, getStateForSession, saveStateForSession } = require('./vaccineMachine');

const app = express();
app.use(urlencoded({ extended: false }));

const PORT = config.PORT;

app.get('/', (req, res) => res.send('💉🌎🌍🌏'));

app.post('/v1/twilio/hook', (req, res) => {
  console.log(req.body);

  const {
    CallSID, From,
  } = req.body;

  const currentState = getStateForSession(CallSID);

  /*
    const twiml = new VoiceResponse();
    twiml.say({voice: 'alice'}, 'Please leave your name and phone number at the beep.');
*/

  // const initialState = vaccineMachine.getInitialState();;
  // console.log(initialState.value);

  console.log(`State before machine is run: ${currentState.value}`);

  const nextState = vaccineMachine.transition(currentState, {res: res, type: 'PRESS_ONE'});

  saveStateForSession(CallSID, nextState);

  console.log(`After state is run: ${currentState.value}`);


    res.setHeader('Content-Type', 'text/xml');
    // res.write(twiml.toString());
    res.end();
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
