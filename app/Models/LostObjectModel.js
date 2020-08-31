const mongoose = require("mongoose");

const LostObjectSchema = mongoose.Schema({
  reportBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reportTitle: { type: String, required: true },
  reportBody: { type: String, required: false },
  lostObjectDate: { type: Date, default: Date.now },
  objectImage: {
    type: String,
    default:
      "https://res.cloudinary.com/daonikhft/image/upload/v1597364668/Screenshot_2020-08-07_at_3.17.40_PM_qzw54m.png",
  },
  objectId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, // in case it's a CSE Item
  found: { type: Boolean }, // 0 if lost 1 if found
});

const LostObject = mongoose.model("LostObject", LostObjectSchema);
module.exports = LostObject;
