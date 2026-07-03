const bcrypt = require('bcryptjs');
const User = require('../model/user.model');
const cloudinary = require('../utils/cloudinary');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../utils/asyncHandler');
const { apiResponse } = require('../utils/apiResponse');

const signup = asyncHandler(async (req, res, next) => {
  const { fullname, email, phone, password, address, role } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullname, email, phone and password are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      phone,
      password: hashedPassword,
      address,
      role: role || 'normaruser',
    });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      address: user.address,
        imgPublicId: user.imgPublicId,
      role: user.role,
    },
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return apiResponse(res, 400, 'email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return apiResponse(res, 404, 'User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return apiResponse(res, 401, 'Invalid password');
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    role: user.role,
    login: true,
  };

  return apiResponse(res, 200, 'Login successful');
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}).select('-password');
  return apiResponse(res, 200, 'Users fetched successfully', users);
});

const getSingleUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user) {
    return apiResponse(res, 404, 'User not found');
  }

  return apiResponse(res, 200, 'User fetched successfully', user);
});

module.exports = { signup, login, getAllUsers, getSingleUser };