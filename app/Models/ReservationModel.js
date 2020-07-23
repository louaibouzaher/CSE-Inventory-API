const mongoose = require("mongoose");

const ReservationSchema = mongoose.Schema({
  reservationBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  reservationTitle: { type: String, required: true },
  reservationBody: { type: String, required: false },
  reservationDate: { type: Date, default: Date.now },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  objectsNeeded: [
    { type: mongoose.Schema.Types.ObjectId, ref: Item, required: true },
  ],
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
});

const Reservation = mongoose.model("Reservation", ReservationSchema);
module.exports = Reservation;
