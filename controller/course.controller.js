// const Course = require('../model/course.model');
// const { asyncHandler } = require('../utils/asyncHandler');
// const { apiResponse } = require('../utils/apiResponse');
// const cloudinary = require('../utils/cloudinary');
// const fs = require('fs');
// const path = require('path');

// const createCourse = asyncHandler(async (req, res) => {
//   const { title, description, dailyUnlock, status } = req.body;

//   if (!title) {
//     return apiResponse(res, 400, 'Title is required');
//   }

//   const course = await Course.create({
//     title,
//     description,
//     dailyUnlock: dailyUnlock === 'true' || dailyUnlock === true,
//     status: status || 'active',
//   });

//   return apiResponse(res, 201, 'Course created successfully', course);
// });

// const getCourses = asyncHandler(async (req, res) => {
//   const { search, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
//   const query = {};

//   if (search) {
//     query.$or = [
//       { title: { $regex: search, $options: 'i' } },
//       { description: { $regex: search, $options: 'i' } },
//     ];
//   }

//   if (status) query.status = status;

//   const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
//   const skip = (Number(page) - 1) * Number(limit);

//   const [courses, total] = await Promise.all([
//     Course.find(query).sort(sort).skip(skip).limit(Number(limit)),
//     Course.countDocuments(query),
//   ]);

//   return apiResponse(res, 200, 'Courses fetched successfully', { courses, total, page: Number(page), limit: Number(limit) });
// });

// const getCourseById = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (!course) return apiResponse(res, 404, 'Course not found');
//   return apiResponse(res, 200, 'Course fetched successfully', course);
// });

// const updateCourse = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (!course) return apiResponse(res, 404, 'Course not found');

//   const { title, description, dailyUnlock, status } = req.body;
//   if (title) course.title = title;
//   if (description !== undefined) course.description = description;
//   if (dailyUnlock !== undefined) course.dailyUnlock = dailyUnlock === 'true' || dailyUnlock === true;
//   if (status) course.status = status;

//   await course.save();
//   return apiResponse(res, 200, 'Course updated successfully', course);
// });

// const deleteCourse = asyncHandler(async (req, res) => {
//   const course = await Course.findByIdAndDelete(req.params.id);
//   if (!course) return apiResponse(res, 404, 'Course not found');
//   return apiResponse(res, 200, 'Course deleted successfully');
// });

// const uploadThumbnail = asyncHandler(async (req, res) => {
//   if (!req.file) return apiResponse(res, 400, 'Thumbnail is required');

//   const result = await cloudinary.uploader.upload(req.file.path, { folder: 'team-management/thumbnails' });
//   const course = await Course.findById(req.params.id);
//   if (!course) return apiResponse(res, 404, 'Course not found');

//   course.image = result.secure_url;
//   await course.save();

//   fs.unlinkSync(req.file.path);
//   return apiResponse(res, 200, 'Thumbnail uploaded successfully', { image: course.image });
// });

// module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse, uploadThumbnail };
