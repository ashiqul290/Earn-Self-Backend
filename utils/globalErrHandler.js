const globalErrHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    statusCode,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.error = err.name || 'Error';
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};


module.exports = {
  globalErrHandler
};
