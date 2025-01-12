// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();  // Load environment variables from .env

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,  // Adjust this based on your needs
    queueLimit: 0
});

// Export the pool for use in other modules
module.exports = pool;
