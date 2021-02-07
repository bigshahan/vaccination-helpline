const { urlencoded } = require('body-parser');
const express = require('express');
const twilioHook = require('./twilioHook');
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

const config = require('./config');

const app = express();
app.use(urlencoded({ extended: false }));

const PORT = config.PORT;


app.get('/', (req, res) => res.send('💉🌎🌍🌏'));

app.post('/v1/twilio/hook', twilioHook);

app.get('/crash', () => {
  throw new Error('haha');
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
