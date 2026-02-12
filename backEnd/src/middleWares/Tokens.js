import dotenv from 'dotenv';
dotenv.config();
import jwt from "jsonwebtoken";


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const token = authHeader.split(" ")[1];
    // console.log("Token:", token);
    try {

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export default verifyToken;
