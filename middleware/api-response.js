const http = require('http');

// Function to prepare response body with optional values
const prepareBody = (
  statusCode,
  payload = null,
  message = http.STATUS_CODES[statusCode],
  page = null,
) => ({
  statusCode,
  message,
  ...(page !== null && { page }), // include the property if not null
  ...(payload !== null && { payload }),
});

// Middleware for ApiResponseing with standardized methods
module.exports = (req, res, next) => {
  // Successful response (OK)
  res.ok = (data = null, message = 'OK', page) => {
    if (data && data.message) {
      return res.status(405).json(prepareBody(405, {}, data.message));
    }
    return res.status(200).json(prepareBody(200, data, message, page));
  };

  // Created response
  res.created = (data = null, message) => {
    res.status(201);
    return res.json(prepareBody(201, data, message));
  };

  res.noContent = (data = null, message) => res.status(204).json(prepareBody(204, data, message));

  // Common function to prepare error response
  const prepareErrorResponse = (status, message) => {
    const output = prepareBody(status, null, message);
    const error = new Error(output.message);
    error.output = output;
    return next(error);
  };

  // Error responses
  res.badRequest = (message) => prepareErrorResponse(400, message);
  res.unauthorized = (message) => prepareErrorResponse(401, message);
  res.forbidden = (message) => prepareErrorResponse(403, message);
  res.notFound = (message) => prepareErrorResponse(404, message);
  res.internalServerError = (message) => prepareErrorResponse(500, message);

  next();
};
