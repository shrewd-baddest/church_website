import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const token = authHeader.split(" ")[1];
    // console.log("Token:", token);
    try {
        const secretKey = process.env.SECRET_KEY || "default-secret-key-change-in-production";
        const decoded = jwt.verify(token, secretKey);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export default verifyToken;
