const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});
const Action = require('../Models/ActionModel')
const lostObject = require("../Models/LostObjectModel");
const Image = require("../Models/ImageModel")
const auth = require("../Middleware/auth");

// GET Request to All Lost Item
router.get("/all", async (req, res) => {
  const lostObjects = await lostObject
    .find()
    .populate("reportBy")
    .populate("objectId");
  res.send(lostObjects);
});

//GET one lost object
router.get("/:id", async (req, res) => {
  try {
    const object = await lostObject.findById(req.params.id).populate("imageId")
    res.contentType('image/png');
    res.send(object.imageId.finalImg.image)

  } catch (err) {
    console.log(err)
    res.send(err)
  }
})


// POST Request to Add a new Lost Item
router.post(
  "/add",
  auth,
  upload.single("objectImage"),
  async (req, res, next) => {
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');

    const finalImg = {
      contentType: req.file.mimetype,
      image: Buffer.from(encode_image, 'base64')
    };

    const image = new Image({
      finalImg
    })

    await image.save()
    console.log(image)

    const newLostObject = new lostObject({
      reportTitle: req.body.reportTitle,
      objectImage: req.file.path,
      reportBody: req.body.reportBody,
      reportBy: req.user.id,
      imageId: image._id
    });
    try {
      await newLostObject.save();
      var img = fs.readFileSync(req.file.path);
      var encode_image = img.toString('base64');
      // Define a JSONobject for the image attributes for saving to database

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
