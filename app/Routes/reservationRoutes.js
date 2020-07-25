const express = require("express");
const router = express.Router();
const Joi = require("Joi");
const auth = require("../Middleware/auth");
const Reservation = require("../Models/ReservationModel");
const Action = require("../Models/ActionModel");
// GET Request to list all reservations
router.get("/all", async (req, res) => {
  try {
    const allReservations = await Reservation.find()
      .populate("objectsNeeded")
      .populate("reservationBy")
      .populate("allowedUsers");
    res.json({
      allReservations,
      message: "Reservations sent successfully",
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// GET Request for a perticular reservation
router.get("/:id", async (req, res) => {
  try {
    const reservationRequested = await Reservation.findById(req.params.id)
      .populate("objectsNeeded")
      .populate("reservationBy")
      .populate("allowedUsers");
    res.json(reservationRequested);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// 
router.post("/takenow/:id", auth, async (req, res) => {
  const reservationSchema = Joi.object().keys({
    reservationBy: Joi.string().required(),
    reservationTitle: Joi.string().required(),
    reservationBody: Joi.string(),
    startsAt: Joi.string().required(),
    endsAt: Joi.string().required(),
    objectsNeeded: Joi.array().items(Joi.string()),
    allowedUsers: Joi.array().items(Joi.string()),
  });

  const dateStart = new Date();
  const body = {
    reservationBy: req.user.id,
    reservationTitle: req.body.reservationTitle,
    reservationBody: req.body.reservationBody
      ? req.body.reservationBody
      : "noBody",
    startsAt:
      `${dateStart.getFullYear}` +
      "/" +
      `${dateStart.getMonth}` +
      "/" +
      `${dateStart.getDate}`,
    endsAt: "Date Not Defined", // Taken now without previous reservation
    objectsNeeded: [`${req.params.id}`],
    allowedUsers: req.body.allowedUsers ? req.body.allowedUsers : ["NoUsers"],
  };
  const result = reservationSchema.validate(body);
  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  try {
    const newReservation = new Reservation({
      reservationBy: req.user.id,
      reservationTitle: req.body.reservationTitle,
      reservationBody: req.body.reservationBody,
      startsAt: req.body.startsAt,
      endsAt: req.body.endsAt,
      objectsNeeded: req.body.objectsNeeded,
      allowedUsers: req.body.allowedUsers,
    });
    await newReservation.save();
    const newAction = new Action({
      reservationId: newReservation._id,
      done: false,
    });
    await newAction.save().then(
      res.send({
        newReservation,
        newAction,
        message: "Reservation created successfully",
      })
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});
// POST Request to add a new reservation
router.post("/add", auth, async (req, res, next) => {
  const reservationSchema = Joi.object().keys({
    reservationBy: Joi.string().required(),
    reservationTitle: Joi.string().required(),
    reservationBody: Joi.string(),
    startsAt: Joi.string().required(),
    endsAt: Joi.string().required(),
    objectsNeeded: Joi.array().items(Joi.string()),
    allowedUsers: Joi.array().items(Joi.string()),
  });
  const body = {
    reservationBy: req.user.id,
    reservationTitle: req.body.reservationTitle,
    reservationBody: req.body.reservationBody
      ? req.body.reservationBody
      : "noBody",
    startsAt: req.body.startsAt,
    endsAt: req.body.endsAt,
    objectsNeeded: req.body.objectsNeeded,
    allowedUsers: req.body.allowedUsers,
  };
  const result = reservationSchema.validate(body);

  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  try {
    const newReservation = new Reservation({
      reservationBy: req.user.id,
      reservationTitle: req.body.reservationTitle,
      reservationBody: req.body.reservationBody,
      startsAt: req.body.startsAt,
      endsAt: req.body.endsAt,
      objectsNeeded: req.body.objectsNeeded,
      allowedUsers: req.body.allowedUsers,
    });
    await newReservation.save().then(
      res.send({
        newReservation,
        message: "Reservation created successfully",
      })
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
  next();
});

// PATCH Request to edit existing reservation
router.patch("/edit/:id", auth, async (req, res) => {
  const originalReservation = await Reservation.findById(req.params.id);
  const reservationSchema = Joi.object().keys({
    reservationBy: Joi.string().required(),
    reservationTitle: Joi.string().required(),
    reservationBody: Joi.string(),
    startsAt: Joi.string().required(),
    endsAt: Joi.string().required(),
    objectsNeeded: Joi.array().items(Joi.string()),
    allowedUsers: Joi.array().items(Joi.string()),
  });
  const body = {
    reservationBy: req.user.id,
    reservationTitle: req.body.reservationTitle
      ? req.body.reservationTitle
      : originalReservation.reservationTitle,
    reservationBody: req.body.reservationBody
      ? req.body.reservationBody
      : originalReservation.reservationBody,
    startsAt: req.body.startsAt
      ? req.body.startsAt
      : originalReservation.startsAt,
    endsAt: req.body.endsAt ? req.body.endsAt : originalReservation.endsAt,
    objectsNeeded: req.body.objectsNeeded
      ? req.body.objectsNeeded
      : originalReservation.objectNeeded,
    allowedUsers: req.body.allowedUsers
      ? req.body.userId
      : originalReservation.allowedUsers,
  };
  const result = reservationSchema.validate(body);

  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }
  try {
    if (originalReservation) {
      try {
        await Reservation.findByIdAndUpdate(req.params.id, {
          reservationBy: req.user.id,
          reservationTitle: req.body.reservationTitle
            ? req.body.reservationTitle
            : originalReservation.reservationTitle,
          reservationBody: req.body.reservationBody
            ? req.body.reservationBody
            : originalReservation.reservationBody,
          startsAt: req.body.startsAt
            ? req.body.startsAt
            : originalReservation.startsAt,
          endsAt: req.body.endsAt
            ? req.body.endsAt
            : originalReservation.endsAt,
          objectsNeeded: req.body.objectsNeeded
            ? req.body.objectsNeeded
            : originalReservation.objectNeeded,
          allowedUsers: req.body.allowedUsers
            ? req.body.userId
            : originalReservation.allowedUsers,
        });
        const editedReservation = await Reservation.findById(req.params.id);
        res.json({
          editedReservation,
          message: "Reservation Updated Successfully",
        });
      } catch (err) {
        console.log(err);
        res.sendStatus(500);
      }
    } else {
      res.status(404).json({
        message: "Reservation does not exist !",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500);
  }
});

// DELETE Request to delete reservation
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedReservation = await Reservation.findById(req.params.id);
  if (deletedReservation) {
    try {
      await deletedReservation.delete();
      res.json({
        message: "Reservation Deleted",
      });
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
