const express = require("express");
const router = express.Router();
const Action = require("../Models/ActionModel");
const { read } = require("fs");

// GET Request to all Actions
router.get("/all", async (req, res) => {
  try {
    const allActions = await Action.find()
      .populate("reportId")
      .populate("reservationId")
      .populate("lostObjectId");

    res.json(allActions);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.patch("/edit/:id", async (req, res) => {
  const targetAction = Action.findById(req.params.id);
  try {
    await targetAction
      .update({
        done: req.body.done,
      })
      .then(res.sendStatus(200));
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

module.exports = router;
