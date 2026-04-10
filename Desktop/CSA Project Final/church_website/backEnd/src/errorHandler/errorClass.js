


export  class UploadError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "UploadError";
    this.code = code; // e.g. "UNSUPPORTED_TYPE", "DESTINATION_ERROR"
  }
}