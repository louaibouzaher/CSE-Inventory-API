const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const Joi = require("joi");
const cloudinary = require("cloudinary");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});
const Action = require("../Models/ActionModel");
const lostObject = require("../Models/LostObjectModel");
const auth = require("../Middleware/auth");

const { cloud_name, api_key, api_secret } = require("../Configs/config");

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

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
    const object = await lostObject.findById(req.params.id).populate("imageId");
    res.send(object);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

// POST Request to Add a new Lost Item
router.post(
  "/add",
  auth,
  upload.single("objectImage"),
  async (req, res, next) => {
    const lostObjectSchema = Joi.object().keys({
      reportTitle: Joi.string().required(),
      objectImage: Joi.string().required(),
      reportBody: Joi.string(),
      reportBy: Joi.string().required(),
      found: Joi.boolean(),
    });
    const body = {
      reportBy: req.user.id,
      reportTitle: req.body.reportTitle,
      objectImage: req.file.path,
      reportBody: req.body.reportBody,
      found: req.body.found,
    };
    const result = lostObjectSchema.validate(body);

    const { error } = result;
    const valid = error == null;

    if (!valid) {
      return res.status(422).json({
        message: "Invalid request",
        data: body,
      });
    }
    try {
      cloudinary.uploader.upload(req.file.path, async (image) => {
        const newLostObject = new lostObject({
          reportTitle: req.body.reportTitle,
          objectImage: image.url,
          reportBody: req.body.reportBody,
          reportBy: req.user.id,
          found: req.body.found,
        });
        await newLostObject.save();

        const newAction = new Action({
          lostObjectId: newLostObject._id,
          type: "lostObject",
        });

        await newAction.save();

        return res.send({
          newLostObject,
          newAction,
          message: "Object Added Successfully",
        });
      });
    } catch (err) {
      console.log(err);
    }
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

    if (targetObject) {
      const lostObjectSchema = Joi.object().keys({
        reportTitle: Joi.string().required(),
        objectImage: Joi.string().required(),
        reportBody: Joi.string(),
        reportBy: Joi.string().required(),
        imageId: Joi.string().required(),
        found: Joi.boolean(),
      });
      const body = {
        reportBy: req.user.id,
        reportTitle: req.body.reportTitle
          ? req.body.reportTitle
          : targetObject.reportTitle,
        objectImage: correctImage,
        reportBody: req.body.reportBody
          ? req.body.reportBody
          : targetObject.reportBody,
        imageId: targetObject.imageId,
        found: req.body.found,
      };
      const result = lostObjectSchema.validate(body);

      const { error } = result;
      const valid = error == null;

      if (!valid) {
        return res.status(422).json({
          message: "Invalid request",
          data: body,
        });
      }
      if (correctImage == req.file.path) {
        fs.unlinkSync(`./${targetObject.objectImage}`);
        cloudinary.uploader.upload(req.file.path, async (image) => {
          correctImage = image.url;
        });
      }

      targetObject.reportTitle = body.reportTitle;
      targetObject.reportBody = body.reportBody;
      targetObject.objectImage = correctImage;
      targetObject.found = body.found;
      await targetObject.save();
      const newAction = new Action({
        lostObjectId: targetObject._id,
        type: "lostObject",
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
    if (deletedObject.reportBy.id == req.user.id) {
      try {
        fs.unlinkSync(`./${deletedObject.objectImage}`);
        const oldImage = await Image.findById(deletedObject.imageId);
        await oldImage.delete();
        const actionRelated = await Action.findOne({
          lostObjectId: deletedObject._id,
        });
        (actionRelated.done = true), await actionRelated.save();
        await deletedObject.delete();
        res.status(202).send("Object Removed Successfully");
      } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
      }
    } else {
      res.json({
        message: "You cant delete it",
      });
    }
  } else {
    res.status(404).send("Object Not Found");
  }
});

module.exports = router;
