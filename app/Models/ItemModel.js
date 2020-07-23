const mongoose = require("mongoose");

const itemHistorySchema = mongoose.Schema({
  takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true },
  actionType: { type: String, required: true }, // Action type is either "In" or "Out" or "Reserved"
  actionDate: { type: Date, default: Date.now },
  takenFor: { type: String },
});

const ItemSchema = mongoose.Schema({
  objectName: { type: String, required: true },
  objectImage: {  type: String, required: true },
  objectOccurence: { type: Number, required: true, default: 1},
  objectState: { type: String, required: true }, // Broken, Mobile, Immobile 
  itemHistory: [itemHistorySchema], // this field contains an array of all previous transfers of this item
});

const Item = mongoose.model("Item", ItemSchema);
module.exports = Item;
