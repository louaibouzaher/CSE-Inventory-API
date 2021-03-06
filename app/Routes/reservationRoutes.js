const express = require("express");
const router = express.Router();
const Joi = require("joi");
const auth = require("../Middleware/auth");
const Reservation = require("../Models/ReservationModel");
const Action = require("../Models/ActionModel");

// GET Request to list all reservations
router.get("/all", auth, async (req, res) => {
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
router.get("/:id", auth, async (req, res) => {
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

//  POST Request for takeNow item
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

  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  var dateStart = yyyy + "-" + mm + "-" + dd;

  const body = {
    reservationBy: req.user.id,
    reservationTitle: req.body.reservationTitle,
    reservationBody: req.body.reservationBody
      ? req.body.reservationBody
      : "noBody",
    startsAt: dateStart,
    endsAt: "Date Not Defined", // Taken now without previous reservation
    objectsNeeded: [`${req.params.id}`],
    allowedUsers: req.body.allowedUsers ? req.body.allowedUsers : ["NoUsers"],
  };
  const result = reservationSchema.validate(body);
  const { error } = result;
  const valid = error == null;

  if (!valid) {
    return res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  const reservations = await Reservation.find();
  var dates = [];

  for (const reservation of reservations) {
    if (reservation.objectsNeeded.indexOf(req.params.id) !== -1) {
      let from = new Date(
        reservation.startsAt.slice(0, 4),
        reservation.startsAt.slice(5, 7) - 1,
        reservation.startsAt.slice(8)
      );
      dates.push(from);
      let to = new Date(
        reservation.endsAt.slice(0, 4),
        reservation.endsAt.slice(5, 7) - 1,
        reservation.endsAt.slice(8)
      );

      if (today >= from) {
        if (today <= to) {
          console.log("startCheck between from and to");
          return res.status(400).json({
            msg: "Can't make new reservation",
          });
        }
      }
    } else {
      console.log("NOOOOOOOOOOOO !");
    }
  }
  if (dates.length != 0) {
    let reservationEnds = new Date(Math.min(...dates));
    let dd = reservationEnds.getDate();
    let mm = reservationEnds.getMonth() + 1;
    let yyyy = reservationEnds.getFullYear();
    if (dd < 10) {
      dd = "0" + dd;
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    var dateEnd = yyyy + "-" + mm + "-" + dd;
  } else {
    let currentDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    let dd = currentDate.getDate();
    let mm = currentDate.getMonth() + 1;
    let yyyy = currentDate.getFullYear();
    if (dd < 10) {
      dd = "0" + dd;
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    var dateEnd = yyyy + "-" + mm + "-" + dd;
  }

  try {
    const newReservation = new Reservation({
      reservationBy: req.user.id,
      reservationTitle: req.body.reservationTitle,
      reservationBody: req.body.reservationBody,
      startsAt: dateStart,
      endsAt: dateEnd,
      objectsNeeded: [`${req.params.id}`],
      allowedUsers: req.body.allowedUsers,
    });
    await newReservation.save();
    const newAction = new Action({
      reservationId: newReservation._id,
      type: "reservation",
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
// POST Request to return an item
router.post("/return/:id", auth, async (req, res) => {
  try {
    const userReservation = await Reservation.findById(req.params.id);
    if (userReservation.reservationBy == 'req.user.id') {
      userReservation.returned = true;
      await userReservation.save();
      const relatedAction = await Action.findOne({
        reservationId: req.params.id,
      });
      relatedAction.done = true;
      await relatedAction.save();
      res.json({
        message: "Successfully returned",
      });
    } else {
      res.json({
        message: "You can not return this item",
      });
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
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
    return res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  const reservations = await Reservation.find();

  for (const reservation of reservations) {
    for (const object of req.body.objectsNeeded) {
      if (reservation.objectsNeeded.indexOf(object) !== -1) {
        let from = new Date(
          reservation.startsAt.slice(0, 4),
          reservation.startsAt.slice(5, 7) - 1,
          reservation.startsAt.slice(8)
        );
        let to = new Date(
          reservation.endsAt.slice(0, 4),
          reservation.endsAt.slice(5, 7) - 1,
          reservation.endsAt.slice(8)
        );
        let startCheck = new Date(
          req.body.startsAt.slice(0, 4),
          req.body.startsAt.slice(5, 7) - 1,
          req.body.startsAt.slice(8)
        );
        let endCheck = new Date(
          req.body.endsAt.slice(0, 4),
          req.body.endsAt.slice(5, 7) - 1,
          req.body.endsAt.slice(8)
        );
        if (startCheck >= from) {
          if (startCheck <= to) {
            console.log("startCheck between from and to");
            return res.status(400).json({
              msg: "Can't make new reservation",
            });
          }
        } else {
          if (endCheck >= from) {
            console.log("endCheck after from");
            return res.status(400).json({
              msg: "Can't make new reservation",
            });
          }
        }
      } else {
        console.log("NOOOOOOOOOOOO !");
      }
    }
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
      type: "reservation",
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
  next();
});

// PATCH Request to edit existing reservation
router.patch("/edit/:id", auth, async (req, res) => {
  const originalReservation = await Reservation.findById(req.params.id);

  if (originalReservation.id == req.user.id) {
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
          const newAction = new Action({
            reservationId: editedReservation._id,
            type: "reservation",
            done: false,
          });
          await newAction.save().then(
            res.send({
              editedReservation,
              newAction,
              message: "Reservation edited successfully",
            })
          );
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
  } else {
    res.json({
      message: `You can't edit this reservation`,
    });
  }
});

// DELETE Request to delete reservation
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedReservation = await Reservation.findById(req.params.id);
  if (deletedReservation.reservationBy == req.user.id) {
    if (deletedReservation) {
      try {
        const actionRelated = await Action.findOne({
          reservationId: deletedReservation._id,
        });
        (actionRelated.done = true), await actionRelated.save();
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
  } else {
    res.json({
      message: `You can't delete this reservation`,
    });
  }
});

module.exports = router;
