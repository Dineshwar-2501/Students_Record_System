const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

const pool= mysql.createPool(process.env.DATABASE_URL);
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     port: process.env.DB_PORT,
//     waitForConnections: true,
//     connectionLimit: 10, // Adjust based on needs
//     queueLimit: 0
// });

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to Railway database!');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
})();

// Export the pool for use in other modules
module.exports = pool;
