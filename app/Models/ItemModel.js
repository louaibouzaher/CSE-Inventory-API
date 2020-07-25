const mongoose = require("mongoose");

const ItemSchema = mongoose.Schema({
  objectName: { type: String, required: true },
  objectDescription: { type: String },
  objectImage: { type: String, required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image',},
  objectOccurence: { type: Number, required: true, default: 1 },
  objectState: { type: String, required: true }, // Broken, Mobile, Immobile
 });

const Item = mongoose.model("Item", ItemSchema);
module.exports = Item;
