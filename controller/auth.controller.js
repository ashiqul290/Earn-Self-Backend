// const bcrypt = require('bcryptjs');
// const User = require('../model/user.model');
// const cloudinary = require('../utils/cloudinary');
// const path = require('path');
// const fs = require('fs');
// const { asyncHandler } = require('../utils/asyncHandler');
// const { apiResponse } = require('../utils/apiResponse');
// const {
//   signAccessToken,
//   signRefreshToken,
//   signResetToken,
//   verifyRefreshToken,
//   verifyResetToken,
//   hashToken,
// } = require('../utils/jwt');

// const signup = asyncHandler(async (req, res, next) => {
//   const { fullname, email, phone, password, address, role } = req.body;

//   if (!fullname || !email || !phone || !password) {
//     return res.status(400).json({
//       success: false,
//       message: 'fullname, email, phone and password are required',
//     });
//   }

//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     return res.status(409).json({
//       success: false,
//       message: 'User already exists with this email',
//     });
//   }

//   const normalizedRole = ['admin', 'teamleader', 'trainer', 'premiumuser', 'normaluser'].includes(role)
//     ? role
//     : 'normaluser';

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const user = await User.create({
//     fullname,
//     email,
//     phone,
//     password: hashedPassword,
//     address,
//     role: normalizedRole,
//   });

//   res.status(201).json({
//     success: true,
//     message: 'User registered successfully',
//     data: {
//       id: user._id,
//       fullname: user.fullname,
//       email: user.email,
//       phone: user.phone,
//       address: user.address,
//       role: user.role,
//     },
//   });
// });

// const login = asyncHandler(async (req, res, next) => {
//   const { email, phone, password } = req.body;
//   const loginIdentifier = email || phone;

//   if (!loginIdentifier || !password) {
//     return apiResponse(res, 400, 'email/phone and password are required');
//   }

//   const user = await User.findOne({ $or: [{ email: loginIdentifier }, { phone: loginIdentifier }] }).select('+password');
//   if (!user) {
//     return apiResponse(res, 404, 'User not found');
//   }

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return apiResponse(res, 401, 'Invalid password');
//   }

//   const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
//   const refreshToken = signRefreshToken({ id: user._id, email: user.email, role: user.role });

//   user.refreshToken = hashToken(refreshToken);
//   await user.save();

//   req.session.user = {
//     id: user._id,
//     email: user.email,
//     role: user.role,
//     login: true,
//   };

//   return apiResponse(res, 200, 'Login successful', {
//     id: user._id,
//     fullname: user.fullname,
//     email: user.email,
//     phone: user.phone,
//     role: user.role,
//     accessToken,
//     refreshToken,
//   });
// });

// const getCurrentUser = asyncHandler(async (req, res, next) => {
//   const userId = req.session?.user?.id;

//   if (!userId) {
//     return apiResponse(res, 401, 'Please login first');
//   }

//   const user = await User.findById(userId).select('-password');
//   if (!user) {
//     return apiResponse(res, 404, 'User not found');
//   }

//   return apiResponse(res, 200, 'User fetched successfully', user);
// });

// const refreshToken = asyncHandler(async (req, res, next) => {
//   const { refreshToken: incomingRefreshToken } = req.body;

//   if (!incomingRefreshToken) {
//     return apiResponse(res, 400, 'Refresh token is required');
//   }

//   const decoded = verifyRefreshToken(incomingRefreshToken);
//   const user = await User.findById(decoded.id).select('+refreshToken');

//   if (!user || !user.refreshToken || hashToken(incomingRefreshToken) !== user.refreshToken) {
//     return apiResponse(res, 403, 'Invalid refresh token');
//   }

//   const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
//   return apiResponse(res, 200, 'Token refreshed successfully', { accessToken });
// });

// const forgotPassword = asyncHandler(async (req, res, next) => {
//   const { email } = req.body;

//   if (!email) {
//     return apiResponse(res, 400, 'Email is required');
//   }

//   const user = await User.findOne({ email });
//   if (!user) {
//     return apiResponse(res, 404, 'User not found');
//   }

//   const resetToken = signResetToken({ id: user._id });
//   user.resetPasswordToken = hashToken(resetToken);
//   user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
//   await user.save();

//   return apiResponse(res, 200, 'Password reset token generated', { resetToken });
// });

// const resetPassword = asyncHandler(async (req, res, next) => {
//   const { token, password } = req.body;

//   if (!token || !password) {
//     return apiResponse(res, 400, 'Token and password are required');
//   }

//   const decoded = verifyResetToken(token);
//   const user = await User.findOne({ _id: decoded.id, resetPasswordToken: hashToken(token) });

//   if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
//     return apiResponse(res, 400, 'Invalid or expired reset token');
//   }

//   user.password = await bcrypt.hash(password, 10);
//   user.resetPasswordToken = null;
//   user.resetPasswordExpires = null;
//   await user.save();

//   return apiResponse(res, 200, 'Password reset successful');
// });

// const logout = asyncHandler(async (req, res, next) => {
//   const userId = req.session?.user?.id;

//   if (userId) {
//     const user = await User.findById(userId);
//     if (user) {
//       user.refreshToken = null;
//       await user.save();
//     }
//   }

//   req.session.destroy((err) => {
//     if (err) {
//       return apiResponse(res, 500, 'Unable to logout');
//     }

//     res.clearCookie('TeamManagementSystem');
//     return apiResponse(res, 200, 'Logout successful');
//   });
// });

// const getAllUsers = asyncHandler(async (req, res, next) => {
//   const users = await User.find({}).select('-password');
//   return apiResponse(res, 200, 'Users fetched successfully', users);
// });

// const getSingleUser = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;

//   const user = await User.findById(id).select('-password');
//   if (!user) {
//     return apiResponse(res, 404, 'User not found');
//   }

//   return apiResponse(res, 200, 'User fetched successfully', user);
// });

// const listByRole = asyncHandler(async (req, res, next) => {
//   const { role } = req.params;
//   const actorRole = req.session?.user?.role;

//   if (!['admin', 'teamleader'].includes(actorRole)) {
//     return apiResponse(res, 403, 'Only admin or team leader can view users by role');
//   }

//   const allowedRoles = ['admin', 'teamleader', 'trainer', 'premiumuser', 'normaluser'];
//   if (!allowedRoles.includes(role)) {
//     return apiResponse(res, 400, 'Invalid role');
//   }

//   const users = await User.find({ role }).select('-password');
//   return apiResponse(res, 200, `${role} users fetched successfully`, users);
// });

// const trainerStudents = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const actorRole = req.session?.user?.role;
//   const actorId = req.session?.user?.id;

//   if (!['admin', 'teamleader', 'trainer'].includes(actorRole)) {
//     return apiResponse(res, 403, 'Access denied');
//   }

//   const trainerId = actorRole === 'trainer' ? actorId : id;
//   const trainer = await User.findById(trainerId).select('-password');

//   if (!trainer) {
//     return apiResponse(res, 404, 'Trainer not found');
//   }

//   const students = await User.find({ trainer: trainerId }).select('-password');
//   return apiResponse(res, 200, 'Trainer students fetched successfully', {
//     trainer,
//     students,
//   });
// });

// const promoteUser = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const { role: newRole, trainerId } = req.body;

//   const actorRole = req.session?.user?.role;
//   if (!actorRole) {
//     return apiResponse(res, 403, 'Not authorized');
//   }

//   if (actorRole !== 'admin') {
//     return apiResponse(res, 403, 'Only admin can change roles');
//   }

//   const allowedRoles = ['admin', 'teamleader', 'trainer', 'premiumuser', 'normaluser'];
//   if (!allowedRoles.includes(newRole)) {
//     return apiResponse(res, 400, 'Invalid role. Allowed roles: admin, teamleader, trainer, premiumuser, normaluser');
//   }

//   const targetUser = await User.findById(id);
//   if (!targetUser) {
//     return apiResponse(res, 404, 'User not found');
//   }

//   targetUser.role = newRole;

//   if (newRole === 'trainer') {
//     targetUser.trainer = null;
//   } else if (newRole === 'premiumuser' && trainerId) {
//     targetUser.trainer = trainerId;
//   } else {
//     targetUser.trainer = null;
//   }

//   await targetUser.save();

//   return apiResponse(res, 200, 'Role updated successfully', {
//     id: targetUser._id,
//     fullname: targetUser.fullname,
//     email: targetUser.email,
//     role: targetUser.role,
//     trainer: targetUser.trainer,
//   });
// });

// module.exports = {
//   signup,
//   login,
//   getCurrentUser,
//   refreshToken,
//   forgotPassword,
//   resetPassword,
//   logout,
//   getAllUsers,
//   getSingleUser,
//   listByRole,
//   trainerStudents,
//   promoteUser,
// };