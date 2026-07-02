const express = require('express');
const { signup } = require('../../../controller/auth.controller');
const { uploadImage } = require('../../../middleware/upload.middleware');

const auth = express.Router();

auth.post('/signup', uploadImage, signup);

module.exports = auth;