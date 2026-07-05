const { apiResponse } = require('../utils/apiResponse');

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.session?.user?.role || req.user?.role;

    if (!userRole) {
      return apiResponse(res, 401, 'try login first');
    }

    if (roles.includes(userRole)) {
      return next();
    }

    return apiResponse(res, 403, 'Access denied for this role');
  };
};
