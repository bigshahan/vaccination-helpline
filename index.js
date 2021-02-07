const { urlencoded } = require('body-parser');
const express = require('express');
const Airtable = require('airtable');

const config = require('./config');
const twilioHook = require('./twilioHook');

const app = express();
app.use(urlencoded({ extended: false }));

const PORT = config.PORT;

Airtable.configure({ apiKey: config.AIRTABLE_API_KEY });

app.get('/', (req, res) => res.send('💉🌎🌍🌏'));

app.post('/v1/twilio/hook', twilioHook);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
