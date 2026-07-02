const { apiResponse } = require("../utils/apiResponse");

exports.isAdminorMarchenOther = (...role) => {
    return (req, res, next) => {
    if (role.includes(req.session.user.role)) {
      next();
    } else {
      apiResponse(res, 401, "Access denied");
    }
  };
};
  