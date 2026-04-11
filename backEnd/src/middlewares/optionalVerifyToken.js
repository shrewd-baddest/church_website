
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    req.user = null;
    next();
  }
};

export default optionalVerifyToken;
