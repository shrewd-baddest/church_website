import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  // console.error("Redis Client Error", err.message);
});

// Non-blocking connection attempt
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Failed to connect to Redis. Running without Redis features.", error.message);
  }
})();

export default redisClient;
