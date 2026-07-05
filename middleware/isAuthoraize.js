const { apiResponse } = require('../utils/apiResponse');
const { verifyAccessToken } = require('../utils/jwt');

exports.isAuthoraize = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (req.session?.user?.login) {
    return next();
  }

  if (!token) {
    return apiResponse(res, 401, 'try login first');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    req.session.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      login: true,
    };
    return next();
  } catch (error) {
    return apiResponse(res, 401, 'Invalid or expired token');
  }
};