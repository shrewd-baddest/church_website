import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";



const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader && !authHeader.startsWith("Bearer ")) {
    logger.warn("Unauthorized access attempt without token");
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
      const token = authHeader && authHeader.split(" ")[1];
      if (!token){
        logger.warn("Unauthorized access attempt with malformed token");
        return res.status(401).json({ error: "Token required" });
      }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    logger.warn("Unauthorized access attempt with invalid token");
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
export default verifyToken;


