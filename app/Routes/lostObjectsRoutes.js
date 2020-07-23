const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/MulterConfig");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const lostObject = require("../Models/lostObjectModel");

// GET Request to All Lost Item
router.get("/all", async (req, res) => {
  const lostObjects = await lostObject.find();
  res.send(lostObjects);
});

// POST Request to Add a new Lost Item
router.post("/add", upload.single("objectImage"), async (req, res, next) => {
  const newLostObject = new lostObject({
    objectName: req.body.objectName,
    objectImage: req.file.path,
    foundBy: req.body.userName,
  });
  await newLostObject
    .save()
    .then(
      res.status(201).json({
        message: "Object Added Successfully",
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

// PATCH Request to edit an exisiting anouncement about a lost object
router.patch("/edit", upload.single("objectImage"), async (req, res) => {
  const targetObject = await lostObject.find({ _id: req.body.id });
  const correctImage = req.file ? req.file.path : targetObject[0].objectImage; // updated or not by user

  if (targetObject) {
    await lostObject.findOneAndUpdate(
      {
        //these two parameters are fixed and both need to be checked
        _id: req.body.id,
        // foundBy: req.body.userID,
        // DID NOT CHECK YET WITH USER ID
      },
      {
        // This method is the same as $set in console AKA keeps previous values
        objectName: req.body.objectName,
        objectImage: correctImage,
      }
    );
    res.status(202).json({
      message: "Object Updated Successfully",
    });
  } else {
    res.status(404).json({
      message: "Object not found",
    });
  }
});

// DELETE Request to remove items found
router.delete("/delete", async (req, res) => {
  const deletedObject = await lostObject.find({ _id: req.body.id })
  if (deletedObject) {
     await lostObject.findOneAndDelete({
      _id:req.body.id,
      // foundBy: req.body.userID,
      // DID NOT CHECK YET WITH USER ID
    });
    // Delete Picture from server 


  
    res.send(202).json({
      message: "Object removed succefully",
    });
  } else {
    res.status(404).json({
      message: "Object not found",
    });
  }
});

module.exports = router;
