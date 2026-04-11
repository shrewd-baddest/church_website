const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.CORS_ORIGIN;

    // Allow if origin is undefined (no Origin header) or matches the env value
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

export default corsOptions;
