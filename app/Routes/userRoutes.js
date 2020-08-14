const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const cloudinary = require("cloudinary");
const sgMail = require("@sendgrid/mail");

const Reservation = require("../Models/ReservationModel");
const User = require("../Models/UserModel");
const Code = require("../Models/codeModel");
const auth = require("../Middleware/auth");

const { cloud_name, api_key, api_secret } = require("../Configs/config");

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

const { sendGridAPIKey } = require("../Configs/config");
sgMail.setApiKey(sendGridAPIKey);

router.post("/signup", async (req, res) => {
  const userSchema = Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .regex(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/),
    password: Joi.string().required().min(8).max(72),
    phoneNumber: Joi.string().min(3).max(30).required(),
    userFirstName: Joi.string().required(),
    userLastName: Joi.string().required(),
  });

  const body = {
    email: req.body.email,
    password: req.body.password,
    userFirstName: req.body.userFirstName,
    userLastName: req.body.userLastName,
    phoneNumber: req.body.phoneNumber,
  };
  console.log(body);

  const result = userSchema.validate(body);

  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({
      msg: "Email already used !",
    });
  }
  user = await User.findOne({ phoneNumber: req.body.phoneNumber });
  if (user) {
    return res.status(400).json({
      msg: "User phone number already used !",
    });
  }

  try {
    user = new User({
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      userFirstName: req.body.userFirstName,
      userLastName: req.body.userLastName,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      "randomString",
      {
        expiresIn: 10000,
      },
      (err, token) => {
        if (err) throw err;
        return res.status(200).json({
          token,
          user,
        });
      }
    );
  } catch (err) {
    console.log(err.message);
    //return res.send("Error in Saving");
  }
});

router.post("/login", async (req, res) => {
  const userSchema = Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .regex(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/),
    password: Joi.string().required().min(8).max(72),
  });

  const body = {
    email: req.body.email,
    password: req.body.password,
  };

  const result = userSchema.validate(body);

  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  try {
    let user = await User.findOne({
      email: req.body.email,
    });
    if (!user)
      return res.status(400).json({
        message: "user Not Exist",
      });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch)
      return res.status(400).json({
        message: "Incorrect Password !",
      });

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      "secret",
      {
        expiresIn: 3600,
      },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          token,
        });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to restore list of Reservations taken by user
router.get("/takenby/:id", auth, async (req, res) => {
  try {
    const takenByUser = await Reservation.find({
      reservationBy: req.user.id,
    })
      .populate("Item")
      .populate("User");
    res.json({
      takenByUser,
      message: "all items taken by user are successfully sent",
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to get all users filtered
router.get("/all", auth, async (req, res) => {
  try {
    const allUsers = await User.find();
    const filteredAllusers = allUsers.map((user) => ({
      _id: user._id,
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      profileImage: user.profileImage,
    }));
    res.json(filteredAllusers);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// POST Request for a new Password
router.post("/newpassword", async (req, res) => {
  const emailFound = await User.findOne({ email: req.body.email });
  if (!emailFound) {
    return res.json({
      message: "Email not found",
    });
  } else {
    // if email exists in db
    // generate a code
    const verificationCode =
      Math.floor(Math.random() * 9).toString() +
      Math.floor(Math.random() * 9).toString() +
      Math.floor(Math.random() * 9).toString() +
      Math.floor(Math.random() * 9).toString() +
      Math.floor(Math.random() * 9).toString() +
      Math.floor(Math.random() * 9).toString();
    // save the code in DB
    const newVerificationCode = new Code({
      email: req.body.email,
      code: verificationCode,
      done: false,
    });
    await newVerificationCode.save().then(() => {
      // send that code to email
      const codeMessage = {
        to: "louaibouzaher1@gmail.com",
        // req.body.email,
        from: "jm_bouzaher@esi.dz",
        subject: "Verification code for CSE Inventory Account",
        text: "Here is your code " + verificationCode + "",
      };
      console.log("code sent" + verificationCode);
      // sgMail.send(codeMessage);
    });

    res.sendStatus(200);
  }
});

// POST Request to verify the code and grant access to change password
router.post("/verifycode", async (req, res) => {
  const isCodeFound = await Code.findOne({
    email: req.body.email,
    code: req.body.code,
  });
  if (!isCodeFound) {
    return res.json({
      message: "Invalid Verification Code",
    });
  } else {
    // Grant access to change password and delete the code from db
    const targetCode = await Code.findOne({
      email: req.body.email,
      code: req.body.code,
    });
    targetCode.done = true;
    await targetCode.save();
    return res.json({
      message: "User Can Change Password",
    });
  }
});

// POST Request to change password
router.post("/newpassword/add", async (req, res) => {
  const isCodeDone = await Code.findOne({
    email: req.body.email,
    code: req.body.code,
  });
  if (!isCodeDone) {
    return res.send("Invalid Verification Code");
  } else {
    if (isCodeDone.done) {
      const targetUser = await User.findOne({
        email: req.body.email,
      });
      const password = req.body.password.toString();
      if (password.length > 7 && password.length < 73) {
        targetUser.password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        targetUser.password = await bcrypt.hash(targetUser.password, salt);
        await targetUser.save();
        // Delete the code in order not to be used again
        await isCodeDone.delete();
        // Delete other codes related to the same email
        await Code.deleteMany({ email: req.body.email });
        res.send("Password updated successfully");
      } else {
        return res.send(
          "Invalid Password, Passwords should be no less than 8 character and no more than 72"
        );
      }
    } else {
      res.send("Invalid Request");
    }
  }
});
// GET Request to get notifications
// router.get("/mynotifications", auth, async (req, res) => {
//   try {
//     const reservations = await Reservation.find({
//       reservationBy: req.user.id,
//     }).populate("Item");

//     if (reservations.length > 0) {
//       // Verify the time interval
//       const dateCheck = (startsAt, endsAt) => {
//         if (endsAt === "Date Not Defined") {
//           return  `You didn't declare in which day you will return this item`
//         }

//       };

//       res.json({
//         notifications,
//         message: "Push Notifications",
//       });
//     } else {
//       res.json({
//         message: "No notifications",
//       });
//     }
//   } catch (err) {
//     console.log(err);
//     res.sendStatus(500);
//   }
// });
// WILL BE DELETED
router.get("/codes", async (req, res) => {
  const allCodes = await Code.find();
  res.send(allCodes);
});
module.exports = router;
