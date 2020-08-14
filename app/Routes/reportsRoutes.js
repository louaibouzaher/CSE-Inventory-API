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

const auth = require("../Middleware/auth");
const Report = require("../Models/ReportModel");
const Action = require("../Models/ActionModel");

const { cloud_name, api_key, api_secret } = require("../Configs/config");
const e = require("express");

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

// GET Request to all stored Reports
router.get("/all", async (req, res) => {
  try {
    const allReports = await Report.find().populate("reportBy");
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
    const reportRequested = await Report.findById(req.params.id).populate(
      "reportBy"
    );
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
      cloudinary.uploader.upload(req.file.path, async (image) => {
        const newReport = new Report({
          reportBy: req.user.id,
          reportTitle: req.body.reportTitle,
          reportImage: image.url,
          reportBody: req.body.reportBody,
          objectState: req.body.objectState,
        });
        await newReport.save();
        const newAction = new Action({
          reportId: newReport._id,
        });
        await newAction.save();
        return res.send({
          newReport,
          newAction,
          message: "Report created successfully",
        });
      });
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  }
);

// PATCH Request to edit an existing report
router.patch(
  "/edit/:id",
  auth,
  upload.single("reportImage"),
  async (req, res) => {
    const originalReport = await Report.findById(req.params.id);

   if(originalReport.reportBy == req.user.id){
    if (originalReport) {
      const reportSchema = Joi.object().keys({
        reportBy: Joi.string().required(),
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
        await Report.findByIdAndUpdate(req.params.id, {
          reportBy: req.body.userId ? req.body.userId : originalReport.reportBy,
          reportTitle: req.body.ReportTitle
            ? req.body.ReportTitle
            : originalReport.reportTitle,
          reportBody: req.body.ReportBody
            ? req.body.ReportBody
            : originalReport.reportBody,
          reportImage: req.file.path
            ? req.file.path
            : originalReport.reportImage,
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
    } else{
      res.sendStatus(404)
    }
   } else{
     res.json({
       message:`You can't edit this report`
     })
   }
  }
);
router.delete("/delete/:id", auth, async (req, res) => {
  const deletedReport = await Report.findById(req.params.id);
 if(deletedReport.reportBy == req.user.id){
  if (deletedReport) {
    try {
      fs.unlinkSync(`./${deletedReport.reportImage}`);
      const oldImage = await Image.findById(deletedReport.imageId);
      await oldImage.delete();
      const actionRelated = await Action.findOne({
        reportId: deletedReport._id,
      });
      (actionRelated.done = true), await actionRelated.save();
      await deletedReport.delete();
      res.sendStatus(202);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(404);
  }
 } else{
  res.json({
    message:`You can't delete this report`
  })
 }
});
module.exports = router;
