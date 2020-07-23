const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    userFirstName: { type: String, required: true },
    userLastName: { type: String, required: true },
    email: { type: String, required: true }, 
    phoneNumber: { type: Number, required: true },
    department: { type: String },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;