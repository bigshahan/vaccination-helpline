const express = require('express');
const config = require('./config');

console.log(config)

const app = express();
const PORT = config.PORT;
const AIRTABLE_API_KEY = config.AIRTABLE_API_KEY;

app.get('/', (req, res) => res.send('💉 🌎'));

app.post('/v1/twilio/hook', (req, res) => res.send('🧟‍♀️'));

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
