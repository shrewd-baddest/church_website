import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/LENOVO/Desktop/church_website/backEnd/.env' });

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function getAdmin() {
    try {
        const res = await pool.query("SELECT username FROM users WHERE role = 'admin' LIMIT 1");
        if (res.rows.length > 0) {
            console.log('ADMIN_USER:' + res.rows[0].username);
        } else {
            console.log('NO_ADMIN_FOUND');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getAdmin();
