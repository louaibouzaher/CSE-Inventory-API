const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerConfig = require("../Configs/multerConfig");
const fs = require("fs");
const Joi = require("joi");
const upload = multer({
  storage: multerConfig.storage,
  fileFilter: multerConfig.fileFilter,
});

const auth = require("../Middleware/auth");
const Report = require("../Models/ReportModel");
const Action = require("../Models/ActionModel");
const Image = require("../Models/ImageModel");

// GET Request to all stored Reports
router.get("/all", async (req, res) => {
  try {
    const allReports = await Report.find()
      .populate("reportBy")
      .populate("imageId");
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
    const reportRequested = await Report.findById(req.params.id)
      .populate("reportBy")
      .populate("imageId");
    res.json(reportRequested);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post(
  "/add",
  auth,
  upload.single("reportImage"),
  async (req, res, next) => {
    const reportSchema = Joi.object().keys({
      reportBy: req.user.id,
      reportTitle: Joi.string().required(),
      reportImage: Joi.string(),
      reportBody: Joi.string(),
      objectState: Joi.string().required(),
    });
    const body = {
      reportBy: req.user.id,
      reportTitle: req.body.reportTitle,
      reportImage: req.file.path,
      reportBody: req.body.reportBody,
      objectState: req.body.objectState,
    };
    const result = reportSchema.validate(body);

    const { error } = result;
    const valid = error == null;

    if (!valid) {
      return res.status(422).json({
        message: "Invalid request",
        data: body,
      });
    }
    try {
      var img = fs.readFileSync(req.file.path);
      var encode_image = img.toString("base64");

      const finalImg = {
        contentType: req.file.mimetype,
        image: Buffer.from(encode_image, "base64"),
      };

      const image = new Image({
        finalImg,
      });

      await image.save();

      const newReport = new Report({
        reportBy: req.user.id,
        reportTitle: req.body.reportTitle,
        reportImage: req.file.path,
        reportBody: req.body.reportBody,
        objectState: req.body.objectState,
        imageId: image._id,
      });
      await newReport.save();
      const newAction = new Action({
        reportId: newReport._id,
      });
      await newAction.save().then(
        res.send({
          newReport,
          message: "Report created successfully",
        })
      );
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
    next();
  }
);

// PATCH Request to edit an existing report
router.patch(
  "/edit/:id",
  auth,
  upload.single("reportImage"),
  async (req, res) => {
    const reportSchema = Joi.object().keys({
      reportBy:Joi.string().required(),
      reportTitle: Joi.string().required(),
      reportImage: Joi.string(),
      reportBody: Joi.string(),
      objectState: Joi.string().required(),
    });
    const body = {
      reportBy: req.user.id,
      reportTitle: req.body.reportTitle,
      reportImage: req.file.path,
      reportBody: req.body.reportBody,
      objectState: req.body.objectState,
    };
    const result = reportSchema.validate(body);

    const { error } = result;
    const valid = error == null;

    if (!valid) {
     return res.status(422).json({
        message: "Invalid request",
        data: body,
      });
    }
    const originalReport = await Report.findById(req.params.id);
    try {
      await Report.findByIdAndUpdate(req.params.id, {
        reportBy: req.body.userId ? req.body.userId : originalReport.reportBy,
        reportTitle: req.body.ReportTitle
          ? req.body.ReportTitle
          : originalReport.reportTitle,
        reportBody: req.body.ReportBody
          ? req.body.ReportBody
          : originalReport.reportBody,
        reportImage: req.file.path ? req.file.path : originalReport.reportImage,
        objectState: req.body.objectState
          ? req.body.objectState
          : originalReport.objectState,
      });
      const editedReport = await Report.findById(req.params.id);
      const newAction = new Action({
        reportId: editedReport._id,
      });
      await newAction.save().then(
        res.json({
          editedReport,
          message: "Report Updated Successfully",
        })
      );
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedReport = await Report.findById(req.params.id);
  if (deletedReport) {
    try {
      fs.unlinkSync(`./${deletedReport.reportImage}`);
      const oldImage = await Image.findById(deletedReport.imageId);
      await oldImage.delete();
      const actionRelated = await Action.findOne({
        reportId: deletedReport._id,
      });
      actionRelated.done = true,
      await actionRelated.save()
      await deletedReport.delete();
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
