const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const auth = require("../Middleware/auth")
const Report = require("../Models/ReportModel");

// GET Request to all stored Reports
router.get("/all", async (req, res) => {
  try {
    const allReports = await Report.find();
    res.json({
      allReports,
      message: "All reports sent successfully",
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const reportRequested = await Report.findById(req.params.id);
    res.json(reportRequested);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post("/add", auth, upload.single("reportImage"), async (req, res, next) => {
  const newReport = new Report({
    reportBy: req.user.id,
    reportTitle: req.body.reportTitle,
    reportImage: req.file.path,
    reportBody: req.body.reportBody,
    objectState: req.body.objectState,
  });
  console.log(newReport);
  await newReport
    .save()
    .then(
      res.send({
        newReport,
        message: "Report created successfully",
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

router.delete("/delete/:id", async (req, res) => {
  const deletedReport = await Report.find({ _id: req.params.id });
  console.log(deletedReport);
  if (deletedReport.length > 0) {
    try {
      await deletedReport[0].delete();
      res.sendStatus(202);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(404);
  }
});
module.exports = router;
