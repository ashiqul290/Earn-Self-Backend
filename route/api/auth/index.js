const express = require('express');
const {
  signup,
  login,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getAllUsers,
  getSingleUser,
  promoteUser,
  listByRole,
  trainerStudents,
} = require('../../../controller/auth.controller');
const { isAuthoraize } = require('../../../middleware/isAuthoraize');
const { isAdminorMarchenOther } = require('../../../middleware/isAdminorMarchen');
const { authorizeRoles } = require('../../../middleware/roleMiddleware');

const auth = express.Router();

// POST /api/auth/signup
auth.post('/signup', signup);
// POST /api/auth/login
auth.post('/login', login);
// POST /api/auth/refresh-token
auth.post('/refresh-token', refreshToken);
// POST /api/auth/forgot-password
auth.post('/forgot-password', forgotPassword);
// POST /api/auth/reset-password
auth.post('/reset-password', resetPassword);
// POST /api/auth/logout
auth.post('/logout', isAuthoraize, logout);
// GET /api/auth/me
auth.get('/me', isAuthoraize, getCurrentUser);
// GET /api/auth/all-users
auth.get('/all-users', isAuthoraize, authorizeRoles('admin'), getAllUsers);
// GET /api/auth/single-users/:id
auth.get('/single-users/:id', isAuthoraize, getSingleUser);
// GET /api/auth/by-role/:role
auth.get('/by-role/:role', isAuthoraize, authorizeRoles('admin', 'teamleader'), listByRole);
// GET /api/auth/trainer-students/:id
auth.get('/trainer-students/:id', isAuthoraize, authorizeRoles('admin', 'teamleader', 'trainer'), trainerStudents);
// PUT /api/auth/users/:id/role
auth.put('/users/:id/role', isAuthoraize, authorizeRoles('admin'), promoteUser);
// PUT /api/auth/promote/:id
auth.put('/promote/:id', isAuthoraize, authorizeRoles('admin'), promoteUser);

module.exports = auth;
