// Wrapper for http-status to handle v2.x exports
const httpStatus = require('http-status');

// http-status v2.x exports as { default: {...}, status: {...} }
// We want the actual status codes object
module.exports = httpStatus.default || httpStatus;