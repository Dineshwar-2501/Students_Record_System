const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

// Ensure DATABASE_URL is correctly set in Railway
const pool = mysql.createPool(process.env.MYSQL_URL || {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to Railway MySQL!');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
})();

module.exports = pool.promise();
