const Notification = require('../model/notification.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { apiResponse } = require('../utils/apiResponse');

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.session?.user?.id || req.user?.id;
  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
  return apiResponse(res, 200, 'Notifications fetched successfully', notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return apiResponse(res, 404, 'Notification not found');
  notification.isRead = true;
  await notification.save();
  return apiResponse(res, 200, 'Notification marked as read', notification);
});

module.exports = { getNotifications, markAsRead };
