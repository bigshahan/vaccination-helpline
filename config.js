const config = {
  PORT: 8000,
  AIRTABLE_API_KEY: '',
};

if (process.env.PORT) {
  config.PORT = Number(process.env.PORT);
}

if (process.env.AIRTABLE_API_KEY) {
  config.AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
}

module.exports = config;
