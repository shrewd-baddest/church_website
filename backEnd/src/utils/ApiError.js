import { errorHandler } from "../middleWares/error.middlewares.js";
/**
 * @description Common Error class to throw an error from anywhere.
 * The {@link errorHandler} middleware will catch this error at the central place and it will return an appropriate response to the client
 */
//  parameters required in this error class are like as follows 
//  *
//  * @param {number} statusCode
//  * @param {string} message
//  * @param {any[]} errors
//  * @param {string} stack

class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "",) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}


export  class UploadError extends Error {
  constructor(message = "Upload file error", code) {
    super(message);
    this.name = "UploadError";
    this.code = code; // e.g. "UNSUPPORTED_TYPE", "DESTINATION_ERROR"
     Error.captureStackTrace(this, this.constructor);
  }
}

export default  { ApiError  ,  UploadError};
