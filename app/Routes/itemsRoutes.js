const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const Item = require("../Models/ItemModel");

// POST Request to Add a new Item
router.post("/add", upload.single("objectImage"), async (req, res, next) => {
  const newItem = new Item({
    objectName: req.body.objectName,
    objectImage: req.file.path,
    objectState: req.body.objectState, // Broken, Mobile, Immobile 
  })
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
    let item = await Item.findById(req.params.id)
    if (item) {
      try {
        res.send(item)
      } catch (err) {
        res.status(500).send(err)
      }
    }
  } catch (err) {
    res.status(404).json({
      message: "Item does not exist !"
    })
  }
})


module.exports = router;