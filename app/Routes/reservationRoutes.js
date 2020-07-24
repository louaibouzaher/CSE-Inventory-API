const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth")
const Reservation = require("../Models/ReservationModel");

// GET Request to list all reservations
router.get("/all", async (req, res) => {
  try {
    const allReservations = await Reservation.find().populate("objectsNeeded").populate("reservationBy").populate("allowedUsers");
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
    const reservationRequested = await Reservation.findById(req.params.id).populate("objectsNeeded").populate("reservationBy").populate("allowedUsers")
    res.json(reservationRequested);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// POST Request to add a new reservation
router.post("/add", auth, async (req, res, next) => {
  const newReservation = new Reservation({
    reservationBy: req.user.id,
    reservationTitle: req.body.reservationTitle,
    reservationBody: req.body.reservationBody,
    // startsAt: req.body.startsAt,
    // endsAt: req.body.endsAt,
    objectsNeeded: req.body.objectsNeeded,
    allowedUsers: req.body.allowedUsers,
  });
  await newReservation
    .save()
    .then(
      res.send({
        newReservation,
        message: "Reservation created successfully",
      })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
  next();
});

// PATCH Request to edit existing reservation
router.patch("/edit/:id", auth, async (req, res) => {
  const originalReservation = await Reservation.findById(req.params.id);
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
        // startsAt: req.body.startsAt? req.body.startsAt : originalReservation.startsAt,
        // endsAt: req.body.endsAt? req.body.endsAt : originalReservation.endsAt,
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
    return res.status(404).json({
      message: "Reservation does not exist !"
    })
  }
});

// DELETE Request to delete reservation
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedReservation = await Reservation.findById(req.params.id);
  if (deletedReservation) {
    try {
      await deletedReservation.delete();
      res.json({
        message:'Reservation Deleted'
      });
    } catch (err) {
      console.log(err);
      res.sendStatus(500)
    }
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
