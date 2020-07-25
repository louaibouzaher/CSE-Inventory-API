const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const lostObject = require("../Models/LostObjectModel");
const auth = require("../Middleware/auth");

// GET Request to All Lost Item
router.get("/all", async (req, res) => {
  const lostObjects = await lostObject
    .find()
    .populate("reportBy")
    .populate("objectId");
  res.send(lostObjects);
});

// POST Request to Add a new Lost Item
router.post(
  "/add",
  auth,
  upload.single("objectImage"),
  async (req, res, next) => {
    const newLostObject = new lostObject({
      reportTitle: req.body.reportTitle,
      objectImage: req.file.path,
      reportBody: req.body.reportBody,
      reportBy: req.user.id,
    });
    try {
      await newLostObject.save();
      const newAction = new Action({
        lostObjectId: newLostObject._id,
      });
      await newAction
        .save()
        .then(
          res.send({
            newLostObject,
            newAction,
            message: "Object Added Successfully",
          })
        )
        .catch((err) => {
          console.log(err);
          res.send({
            error: err,
          });
        });
    } catch (err) {
      res.send(err);
    }
    next();
  }
);

// PATCH Request to edit an exisiting anouncement about a lost object
router.patch(
  "/edit/:id",
  auth,
  upload.single("objectImage"),
  async (req, res) => {
    const targetObject = await lostObject.findById(req.params.id);
    const correctImage = req.file ? req.file.path : targetObject.objectImage; // updated or not by user

    if (correctImage == req.file.path) {
      fs.unlinkSync(`./${targetObject.objectImage}`);
    }
    if (targetObject) {
      targetObject.reportTitle = req.body.reportTitle;
      targetObject.objectImage = req.file.path;
      await targetObject.save();
      const newAction = new Action({
        lostObjectId: targetObject._id,
      });
      await newAction.save();
      res.status(202).json({
        targetObject,
        newAction,
        message: "Object Updated Successfully",
      });
    } else {
      res.status(404).json({
        message: "Object not found",
      });
    }
  }
);

// DELETE Request to remove items found
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedObject = await lostObject.findById(req.params.id);
  if (deletedObject) {
    try {
      fs.unlinkSync(`./${deletedObject.objectImage}`);
      await deletedObject.delete();
      res.status(202).send("Object Removed Successfully");
    } catch (err) {
      console.log(err);
      res.status(404).send("Object Not Found");
    }
  } else {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
