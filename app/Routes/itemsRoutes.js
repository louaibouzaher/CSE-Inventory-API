const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});
const Joi = require("joi");
const Item = require("../Models/ItemModel");
const Image = require("../Models/ImageModel")

// GET Request to all Items
router.get("/all", async (req, res) => {
  try {
    const allItems = await Item.find().populate("imageId");
    res.json(allItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to all Mobile Items
router.get("/mobile", async (req, res) => {
  try {
    const mobileItems = await Item.find({ objectState: "mobile" }).populate("imageId");
    res.json(mobileItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to all Immobile Items
router.get("/immobile", async (req, res) => {
  try {
    const immobileItems = await Item.find({ objectState: "immobile" }).populate("imageId");
    res.json(immobileItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to all Broken Items
router.get("/broken", async (req, res) => {
  try {
    const brokenItems = await Item.find({ objectState: "broken" }).populate("imageId");
    res.json(brokenItems);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

//GET Request for all Available Items
// Check the action type of the last Item History

// POST Request to Add a new Item
router.post("/add", upload.single("objectImage"), async (req, res, next) => {
  const itemSchema = Joi.object().keys({
    objectName: Joi.string().required(),
    objectDescription: Joi.string(),
    objectImage: Joi.string().required(),
    objectState: Joi.string().required(), // Broken, Mobile, Immobile
  });
  const body = {
    objectName: req.body.objectName,
    objectDescription: req.body.objectDescription,
    objectImage: req.file.path,
    objectState: req.body.objectState, // Broken, Mobile, Immobile
  };
  const result = itemSchema.validate(body);

  const { error } = result;
  const valid = error == null;

  if (!valid) {
    res.status(422).json({
      message: "Invalid request",
      data: body,
    });
  }

  try {
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
    
    const newItem = new Item({
      objectName: req.body.objectName,
      objectDescription: req.body.objectDescription,
      objectImage: req.file.path,
      objectState: req.body.objectState, // Broken, Mobile, Immobile
      imageId: image._id
    });

    await newItem
      .save()
      .then(
        res.status(201).json({
          newItem,
          message: "Item Added Successfully",
        })
      )
     
  } catch (err) {
    res.status(500);
  }
  next();
});

// Get Request to get an Item specified by Id
router.get("/get/:id", async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (item) {
      try {
        res.send(item);
      } catch (err) {
        res.status(500).send(err);
      }
    }
  } catch (err) {
    res.status(404).json({
      message: "Item does not exist !",
    });
  }
});

// DELETE Request to remove an item
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findById(req.params.id);
    if (deletedItem) {
      fs.unlinkSync(`./${deletedItem.objectImage}`);
      await deletedItem.delete();
      res.send("Object removed succefully");
    } else {
      res.send("Item does not exist");
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

module.exports = router;
