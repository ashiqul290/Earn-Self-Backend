const express = require("express");
const auth = require("./auth");
const api = express.Router();

api.use('/auth',auth)

module.exports = api; 