const mongoose = require("mongoose");

const LostObjectSchema = mongoose.Schema({
  reportBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',},
  reportTitle: { type: String, required: true },
  reportBody: { type: String, required: false },
  objectImage: { type: String, required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image',},
  objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }, // in case it's a CSE Item
});

const LostObject = mongoose.model("LostObject", LostObjectSchema);
module.exports = LostObject;
