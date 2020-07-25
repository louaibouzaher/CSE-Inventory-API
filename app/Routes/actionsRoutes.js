const express = require("express");
const router = express.Router();
const Action = require("../Models/ActionModel");

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



module.exports = router;
