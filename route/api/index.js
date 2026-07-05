const express = require('express');
const auth = require('./auth');
const courseController = require('../../controller/course.controller');
const submissionController = require('../../controller/submission.controller');
const cashoutController = require('../../controller/cashout.controller');
const notificationController = require('../../controller/notification.controller');
const { isAuthoraize } = require('../../middleware/isAuthoraize');
const { authorizeRoles } = require('../../middleware/roleMiddleware');
const { uploadImage } = require('../../middleware/upload.middleware');

const api = express.Router();

// USE /api/auth
api.use('/auth', auth);

// GET /api/courses
api.get('/courses', isAuthoraize, courseController.getCourses);
// POST /api/courses
api.post('/courses', isAuthoraize, authorizeRoles('admin'), courseController.createCourse);
// GET /api/courses/:id
api.get('/courses/:id', isAuthoraize, courseController.getCourseById);
// PUT /api/courses/:id
api.put('/courses/:id', isAuthoraize, authorizeRoles('admin'), courseController.updateCourse);
// DELETE /api/courses/:id
api.delete('/courses/:id', isAuthoraize, authorizeRoles('admin'), courseController.deleteCourse);
// POST /api/courses/:id/thumbnail
api.post('/courses/:id/thumbnail', isAuthoraize, authorizeRoles('admin'), uploadImage, courseController.uploadThumbnail);

// POST /api/submissions
api.post('/submissions', isAuthoraize, submissionController.createSubmission);
// GET /api/submissions
api.get('/submissions', isAuthoraize, authorizeRoles('admin', 'trainer'), submissionController.getSubmissions);
// PUT /api/submissions/:id/status
api.put('/submissions/:id/status', isAuthoraize, authorizeRoles('admin', 'trainer'), submissionController.updateSubmissionStatus);
// POST /api/submissions/:id/image
api.post('/submissions/:id/image', isAuthoraize, uploadImage, submissionController.uploadSubmissionImage);

// POST /api/cashouts
api.post('/cashouts', isAuthoraize, cashoutController.requestCashout);
// GET /api/cashouts
api.get('/cashouts', isAuthoraize, authorizeRoles('admin'), cashoutController.getCashouts);
// PUT /api/cashouts/:id/status
api.put('/cashouts/:id/status', isAuthoraize, authorizeRoles('admin'), cashoutController.updateCashoutStatus);

// GET /api/notifications
api.get('/notifications', isAuthoraize, notificationController.getNotifications);
// PUT /api/notifications/:id/read
api.put('/notifications/:id/read', isAuthoraize, notificationController.markAsRead);

module.exports = api;