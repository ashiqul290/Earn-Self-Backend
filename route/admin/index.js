const express = require('express');
const { renderAdminPage, getDashboardStats, handleUserManagementAction } = require('../../controller/admin.controller');
const { isAuthoraize } = require('../../middleware/isAuthoraize');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const adminRouter = express.Router();

// GET /admin/api/dashboard-stats
adminRouter.get('/api/dashboard-stats', isAuthoraize, authorizeRoles('admin'), getDashboardStats);
// POST /admin/users/manage
adminRouter.post('/users/manage', isAuthoraize, authorizeRoles('admin'), handleUserManagementAction);
// GET /admin/:page
adminRouter.get('/:page', isAuthoraize, authorizeRoles('admin'), renderAdminPage);

module.exports = adminRouter;
