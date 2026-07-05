const Submission = require('../model/submission.model');
const Course = require('../model/course.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { apiResponse } = require('../utils/apiResponse');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');

const createSubmission = asyncHandler(async (req, res) => {
  const { course } = req.body;
  if (!course) return apiResponse(res, 400, 'Course is required');

  const courseExists = await Course.findById(course);
  if (!courseExists) return apiResponse(res, 404, 'Course not found');

  const submission = await Submission.create({
    user: req.session?.user?.id || req.user?.id,
    course,
    status: 'pending',
  });

  return apiResponse(res, 201, 'Submission created successfully', submission);
});

const getSubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { status: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [submissions, total] = await Promise.all([
    Submission.find(query).populate('user', 'fullname email').populate('course', 'title').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Submission.countDocuments(query),
  ]);

  return apiResponse(res, 200, 'Submissions fetched successfully', { submissions, total, page: Number(page), limit: Number(limit) });
});

const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const submission = await Submission.findById(req.params.id);
  if (!submission) return apiResponse(res, 404, 'Submission not found');

  submission.status = status;
  submission.reviewedBy = req.session?.user?.id || req.user?.id;
  await submission.save();

  return apiResponse(res, 200, 'Submission status updated successfully', submission);
});

const uploadSubmissionImage = asyncHandler(async (req, res) => {
  if (!req.file) return apiResponse(res, 400, 'Submission image is required');

  const result = await cloudinary.uploader.upload(req.file.path, { folder: 'team-management/submissions' });
  const submission = await Submission.findById(req.params.id);
  if (!submission) return apiResponse(res, 404, 'Submission not found');

  submission.image = result.secure_url;
  await submission.save();

  fs.unlinkSync(req.file.path);
  return apiResponse(res, 200, 'Submission image uploaded successfully', { image: submission.image });
});

module.exports = { createSubmission, getSubmissions, updateSubmissionStatus, uploadSubmissionImage };
