const corsOptions = {
  origin: process.env.CORS_ORIGIN === "*"
      ? "*" // This might give CORS error for some origins due to credentials set to true
      : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production. Refer
    credentials: true,
};

export default corsOptions;