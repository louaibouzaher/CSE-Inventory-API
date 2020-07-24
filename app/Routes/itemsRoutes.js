const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require('fs')
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const Item = require("../Models/ItemModel");


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
// GET Request to all Mobile Items
router.get("/mobile", async (req, res) => {
  try {
    const mobileItems = await Item.find({ objectState: "mobile" });
    res.json(mobileItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to all Immobile Items
router.get("/immobile", async (req, res) => {
  try {
    const immobileItems = await Item.find({ objectState: "immobile" });
    res.json(immobileItems);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// GET Request to all Broken Items
router.get("/broken", async (req, res) => {
  try {
    const brokenItems = await Item.find({ objectState: "broken" });
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
  console.log(`Hello ${req.file.path}`)
  const newItem = new Item({
    objectName: req.body.objectName,
    objectImage: req.file.path,
    objectState: req.body.objectState, // Broken, Mobile, Immobile
  });
  
  await newItem 
    .save()
    .then(
      res.status(201).json({
        newItem,
        message: "Item Added Successfully",
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

// Get Request to get a new Item
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
})

// DELETE Request to remove an item
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findById(req.params.id)
    if (deletedItem) {
      fs.unlinkSync(`./${deletedItem.objectImage}`)
      await deletedItem.delete()
      res.send("Object removed succefully")
    } else {
      res.send("Item does not exist");
    }
  } catch (err) {
    console.log(err)
    res.send(err)
  }
});


module.exports = router;
