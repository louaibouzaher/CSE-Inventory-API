const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv/config");
const reportsRoutes = require("./app/Routes/reportsRoutes");
const lostObjectsRoutes = require("./app/Routes/lostObjectsRoutes");
const itemsRoutes = require("./app/Routes/itemsRoutes");
const userRoutes = require("./app/Routes/userRoutes");
const reservationRoutes = require("./app/Routes/reservationRoutes");
const actionsRoutes = require("./app/Routes/actionsRoutes");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use("./uploads", express.static);

// Routes
app.use("/lostobjects", lostObjectsRoutes);
app.use("/items", itemsRoutes);
app.use("/reports", reportsRoutes);
app.use("/users", userRoutes);
app.use("/reservations", reservationRoutes);
app.use("/actions", actionsRoutes);

// Connecting to Database
const db = require("./app/Configs/db");
db.InitiateMongoServer();

// Listening on port PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
