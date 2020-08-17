require("dotenv/config");
const adminFirebase = require("firebase-admin");
const serviceAccount = require("../cse-inventory-api-firebase-adminsdk-igiuj-91db05f60e.json");

adminFirebase.initializeApp({
  credential: adminFirebase.credential.cert(serviceAccount),
  databaseURL: "https://cse-inventory-api.firebaseio.com",
});

const messenger = adminFirebase.messaging();

messenger.send({
  data: {},
  token: process.env.TEST_TOKEN,
  notification: {
    title: "Notification from Backend",
    body: "some dummy data in body",
  },
});

module.exports = messenger;
