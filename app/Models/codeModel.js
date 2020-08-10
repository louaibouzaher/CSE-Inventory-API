const mongoose = require("mongoose");

const codeModel = mongoose.Schema({
  actionDate: { type: Date, default: Date.now },
  email: { type: String, required: true },
  code: { type: String, required: true },
  done: { type: Boolean, required: true, default: false },
});

const Code = mongoose.model("Code", codeModel);
module.exports = Code;
