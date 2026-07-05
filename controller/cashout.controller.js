const Cashout = require('../model/cashout.model');
const User = require('../model/user.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { apiResponse } = require('../utils/apiResponse');

const requestCashout = asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  if (!amount || !method) return apiResponse(res, 400, 'Amount and method are required');

  const userId = req.session?.user?.id || req.user?.id;
  const user = await User.findById(userId);
  if (!user) return apiResponse(res, 404, 'User not found');

  const cashout = await Cashout.create({ user: userId, amount, method, status: 'pending' });
  return apiResponse(res, 201, 'Cashout requested successfully', cashout);
});

const getCashouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [cashouts, total] = await Promise.all([
    Cashout.find(query).populate('user', 'fullname email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Cashout.countDocuments(query),
  ]);

  return apiResponse(res, 200, 'Cashouts fetched successfully', { cashouts, total, page: Number(page), limit: Number(limit) });
});

const updateCashoutStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const cashout = await Cashout.findById(req.params.id);
  if (!cashout) return apiResponse(res, 404, 'Cashout not found');

  cashout.status = status;
  await cashout.save();
  return apiResponse(res, 200, 'Cashout status updated successfully', cashout);
});

module.exports = { requestCashout, getCashouts, updateCashoutStatus };
