const bcrypt = require('bcryptjs');
const User = require('../model/user.model');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');
const { asyncHandler } = require('../utils/asyncHandler');

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

    let imgUrl = '';

    const uploadedFile = req.files?.img?.[0] || req.file;

    if (uploadedFile) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'team-management-system',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(uploadedFile.buffer).pipe(uploadStream);
      });

      imgUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      phone,
      password: hashedPassword,
      address,
      img: imgUrl,
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
      img: user.img,
      role: user.role,
    },
  });
});

module.exports = { signup };