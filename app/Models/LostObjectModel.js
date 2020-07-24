const mongoose = require("mongoose");

const LostObjectSchema = mongoose.Schema({
  reportBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',},
  reportTitle: { type: String, required: true },
  reportBody: { type: String, required: false },
  objectImage: { type: String, required: true },
  objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }, //
});

const LostObject = mongoose.model("LostObject", LostObjectSchema);
module.exports = LostObject;
