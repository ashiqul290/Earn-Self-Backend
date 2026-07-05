const { apiResponse } = require("../utils/apiResponse");

exports.isAdminorMarchenOther = (...role) => {
  return (req, res, next) => {
    const userRole = req.session?.user?.role;

    if (role.includes(userRole)) {
      next();
    } else {
      apiResponse(res, 401, "Access denied");
    }
  };
};
