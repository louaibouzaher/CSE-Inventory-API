const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const cloudinary = require("cloudinary");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});
const Joi = require("joi");
const Item = require("../Models/ItemModel");

const auth = require("../Middleware/auth")

const { cloud_name, api_key, api_secret } = require("../Configs/config");
const Reservation = require("../Models/ReservationModel");

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

/*const cors = require("cors");
const whitelist = ["https://cse-inventory.herokuapp.com/"]
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}*/

// GET Request to all Items
router.get("/all", async (req, res) => {
  try {
    const allItems = await Item.find();
    res.json(allItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// // GET Request to all Broken Items
// router.get("/broken", async (req, res) => {
//   try {
//     const brokenItems = await Item.find({ objectState: "broken" })
//     res.json(brokenItems);
//   } catch (err) {
//     console.log(err);
//     res.send(500);
//   }
// });

// GET Request to all available items
router.get("/available", async (req, res) => {
  const allItems = await Item.find();
  const allReservations = await Reservation.find();
  const unreturned = allReservations.filter(
    (reservation) => !reservation.returned
  );
  const availableItems = allItems.filter((item) => {
    var isTaken = false;
    unreturned.map((reservation) => {
      if (reservation.objectsNeeded.includes(item.id)) {
        isTaken = true;
      }
    });
    console.log(isTaken);
    return !isTaken;
  });
  res.json(availableItems);
});

// POST Request to Add a new Item
router.post("/add", auth, upload.single("objectImage"), async (req, res, next) => {
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
    cloudinary.uploader.upload(req.file.path, async (image) => {
      const newItem = new Item({
        objectName: req.body.objectName,
        objectDescription: req.body.objectDescription,
        objectImage: image.url,
        objectState: req.body.objectState, // Broken, Mobile, Immobile
      });

      await newItem.save().then(
        res.status(201).json({
          newItem,
          message: "Item Added Successfully",
        })
      );
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
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
router.delete("/delete/:id", auth, async (req, res) => {
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
