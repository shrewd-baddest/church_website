import { testDb } from "../Configs/dbConfig.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Check if user already exists
        const existingUser = await testDb.query("SELECT * FROM users WHERE username = $1", [username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "Username already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const query = `
            INSERT INTO users (username, password, role)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, role, created_at
        `;
        const result = await testDb.query(query, [username, hashedPassword, role || 'user']);

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Server error while creating user" });
    }
};