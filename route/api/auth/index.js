const express = require('express');
const { signup, login, getAllUsers, getSingleUser } = require('../../../controller/auth.controller');
const { uploadImage } = require('../../../middleware/upload.middleware');

const auth = express.Router();

auth.post('/signup', signup);
auth.post('/login', login);
auth.get('/all-users', getAllUsers);
auth.get('/single-users/:id', getSingleUser);

module.exports = auth;