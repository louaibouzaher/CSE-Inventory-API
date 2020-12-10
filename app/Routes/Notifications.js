const express = require("express");
const Reservation = require("../Models/ReservationModel");
const User = require("../Models/UserModel");

// Config
require("dotenv/config");
const adminFirebase = require("firebase-admin");
const serviceAccount = require("../cse-inventory-api-firebase-adminsdk-igiuj-91db05f60e.json");
adminFirebase.initializeApp({
  credential: adminFirebase.credential.cert(serviceAccount),
  databaseURL: "https://cse-inventory-api.firebaseio.com",
});
const messenger = adminFirebase.messaging();

module.exports = messenger;

const pushNotifications = async () => {
  const unreturnedReservations = await Reservation.find({
    returned: false,
  }).populate();
  // Send Reminders about unreturned items
  unreturnedReservations.map((reservation) => {
    // if date not defined
    if (reservation.endsAt == "Date Not Defined") {
      const object = reservation.objectsNeeded[0]; // takenow you can take only one object at a time
      messenger.send({
        title: `Friendly reminder`,
        message: `This message is to remind you have taken ${object} and didn't return it`,
        token: reservation.reservationBy.tokenNotif,
      });
    } else {
      // if there's an endsAt date
      const endsDate = new Date(
        reservation.endsAt.slice(0, 4),
        reservation.endsAt.slice(5, 7) - 1,
        reservation.endsAt.slice(8)
      );
      const today = new Date();
      if (today >= endsDate) {
        const objects = JSON.stringify(reservation.objectsNeeded);
        messenger.send({
          title: `You've exceeded the date of reservation`,
          message: `This message is to remind you have taken ${objects} and didn't return them yet, the deadline is ${reservation.endsAt}`,
          token: reservation.reservationBy.tokenNotif,
        });
      }
    }
  });
};
pushNotifications();
