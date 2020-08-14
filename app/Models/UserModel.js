const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  userFirstName: { type: String, required: true },
  userLastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profileImage: {
    type: String,
    default:
      "https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png",
  },
  department: { type: String },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
