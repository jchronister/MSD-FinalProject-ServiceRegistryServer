"use strict";

const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const {getReturnObject} = require("./middleware/return-object");
const services = require("./routes/services");
const createHttpError = require("http-errors");
const fs = require("fs");
const path = require("path");

// Configure
const app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(cors());
// app.use(express.urlencoded({ extended: false }));

// Setup process.env from .env File
require("dotenv").config();


// Routes
app.get("/", (res, req) => {
  fs.createReadStream(path.join(__dirname, "static", "index.html")).pipe(req);
});
app.use("/services", services);


// No Routes Found
app.use((req, res, next) => {
  next(createHttpError(404, "Not Found"));
});


// Error Handler
app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars

  // Show Errors in Development Mode
  if (req.app.get("env") === "development") {
    var msg = err.message || err;
  } else {
    msg = "Server Error";
  }

  res.status(err.status || 500).json(getReturnObject(msg, null));

});

// Error Catch All
app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars
  res.status(500).send("Server Error");
});

 
app.listen(process.env.PORT || 3000,()=>{
  console.log("application is running on port : " + (process.env.PORT || 3000));  
});