const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv/config");
const lostObjectsRoutes = require('./app/Routes/lostObjectsRoutes');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes 
app.use('/lostobjects', lostObjectsRoutes)

// Connecting to Database
const db = require("./app/Configs/db")
db.InitiateMongoServer()

// Listening on port PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
