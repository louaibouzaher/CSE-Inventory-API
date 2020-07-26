const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    userFirstName: { type: String, required: true },
    userLastName: { type: String, required: true },
    email: { type: String, required: true },
    password:  {type: String, required: true},
    phoneNumber: { type: String, required: true },
    profileImage: {type: String},
    department: { type: String },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;