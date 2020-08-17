const mongoose = require("mongoose");

const ReservationSchema = mongoose.Schema({
  reservationBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reservationTitle: { type: String, required: true },
  reservationBody: { type: String },
  reservationDate: { type: Date, default: Date.now },
  startsAt: { type: String, required: true },
  endsAt: { type: String, required: true },
  objectsNeeded: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  ],
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  returned: {type: Boolean, default: false, required: true}
});

const Reservation = mongoose.model("Reservation", ReservationSchema);
module.exports = Reservation;
