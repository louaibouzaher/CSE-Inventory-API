const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const Reservation = require("../Models/ReservationModel");
const User = require("../Models/UserModel");
const auth = require("../Middleware/auth");

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

  //userSchema.validate(body)

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
        res.status(200).json({
          token,
          user,
        });
      }
    );
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Saving");
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
router.get("/all", async (req, res) => {
  try {
    const allUsers = await User.find();
    const filteredAllusers = allUsers.map((user) => ({
      _id: user._id,
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      phoneNumber: user.phoneNumber,
    }));
    res.json(filteredAllusers);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
module.exports = router;
