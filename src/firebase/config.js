// const dotenv = require("dotenv");
const assert = require("assert");

// dotenv.config();

// const {
//   PORT,
//   HOST,
//   HOST_URL,
//   API_KEY,
//   AUTH_DOMAIN,
//   DATABASE_URL,
//   PROJECT_ID,
//   STORAGE_BUCKET,
//   MESSAGING_SENDER_ID,
//   APP_ID,
// } = process.env;

// assert(PORT, "PORT is required");
// assert(HOST, "HOST is required");

module.exports = {
  port: 8080,
  host: "localhost",
  url: "http://localhost:8080",
  firebaseConfig: {},
};
