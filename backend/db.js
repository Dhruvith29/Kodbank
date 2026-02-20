const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialization Function to create tables
const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to Aiven MySQL successfully.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Customer (
                cid INT AUTO_INCREMENT PRIMARY KEY,
                uname VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                balance DECIMAL(15, 2) DEFAULT 100000.00,
                email VARCHAR(255),
                phone VARCHAR(255),
                role VARCHAR(50) DEFAULT 'customer'
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS CJWT (
                tid INT AUTO_INCREMENT PRIMARY KEY,
                token TEXT,
                cid INT,
                exp DATETIME,
                FOREIGN KEY (cid) REFERENCES Customer(cid) ON DELETE CASCADE
            )
        `);

        connection.release();
        console.log('Database tables initialized.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

// Initialize on require (or call explicitly in server start)
initDB();

module.exports = pool;
