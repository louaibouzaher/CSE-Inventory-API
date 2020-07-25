const mongoose = require("mongoose");

const actionSchema = mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
  lostObjectId: { type: mongoose.Schema.Types.ObjectId, ref: "lostObject" },
  done: { type: Boolean, required: true, default: false },
});

const Action = mongoose.model("Action", actionSchema);
module.exports = Action;
