const VoiceResponse = require('twilio').twiml.VoiceResponse;

const express = require('express');
const config = require('./config');

const app = express();
const PORT = config.PORT;
const AIRTABLE_API_KEY = config.AIRTABLE_API_KEY;

app.get('/', (req, res) => res.send('💉 🌎'));

app.post('/v1/twilio/hook', (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say({voice: 'alice'}, 'Please leave your name and phone number at the beep.');



    res.setHeader('Content-Type', 'text/xml');
    res.write(twiml.toString());
    res.end();
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
