import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import logger from "../logger/winston.js";
// import redisClient from "../Configs/redisConfig.js";

const verifyToken = async (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Unauthorized access attempt without token");
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      logger.warn("Unauthorized access attempt with malformed token");
      return res.status(401).json({ error: "Token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded", decoded);

    req.user = {
      id: decoded.id,
      member_id: decoded.id,
      role: decoded.role,
      jumuiya_id: decoded.jumuiya_id,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email
    };

    next();
    
  } catch (err) {
    logger.warn("Invalid token");
    return res.status(401).json({ message: err.message });
  }
};






export default verifyToken;
