const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require('fs');
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const lostObject = require("../Models/LostObjectModel");

// GET Request to All Lost Item
router.get("/all", async (req, res) => {
  const lostObjects = await lostObject.find();
  res.send(lostObjects);
});

// POST Request to Add a new Lost Item
router.post("/add", upload.single("objectImage"), async (req, res, next) => {
  const newLostObject = new lostObject({
    reportTitle: req.body.reportTitle,
    objectImage: req.file.path,
  });
  console.log(newLostObject)
  try {
    await newLostObject
    .save()
    .then(
      res.send({
        newLostObject,
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
    res.send(err)
  }
  next();
});

// PATCH Request to edit an exisiting anouncement about a lost object
router.patch("/edit/:id", upload.single("objectImage"), async (req, res) => {
  console.log(req.params.id)
  const targetObject = await lostObject.findById(req.params.id);
  console.log(targetObject)
  const correctImage = req.file ? req.file.path : targetObject.objectImage; // updated or not by user

  console.log(correctImage)
  console.log(targetObject.objectImage)

  if (correctImage == req.file.path) {
    fs.unlinkSync(`./${targetObject.objectImage}`)
  }
  if (targetObject) {
    targetObject.reportTitle = req.body.reportTitle
    targetObject.objectImage = req.file.path
    await targetObject.save()
    res.status(202).json({
      targetObject,
      message: "Object Updated Successfully",
    });
  } else {
    res.status(404).json({
      message: "Object not found",
    });
  }
});

// DELETE Request to remove items found
router.delete("/delete/:id", async (req, res) => {
  const deletedObject = await lostObject.findById(req.params.id)
  console.log(deletedObject);
  if (deletedObject) {
    try {
      fs.unlinkSync(`./${deletedObject.objectImage}`)
      await deletedObject.delete();
      res.status(202).send('Object Removed Successfully')
    } catch (err) {
      console.log(err);
      res.status(404).send('Object Not Found');
    }
  } else {
    res.status(500).send('Server Error')
  }
  // Delete Picture from server
});

module.exports = router;
