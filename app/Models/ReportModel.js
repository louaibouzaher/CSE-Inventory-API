const mongoose = require("mongoose");

const ReportSchema = mongoose.Schema({
  reportBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true },
  reportTitle: { type: String, required: true },
  reportImage: { type: String, required: true },
  reportBody: { type: String, required: false },
  objectState: { type: String, required: true }, // Broken , Lost 
});

const Report = mongoose.model("Report", ReportSchema);
module.exports = Report;
