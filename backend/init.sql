-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS kodbank;
USE kodbank;

-- Create Customer Table
CREATE TABLE IF NOT EXISTS Customer (
    cid INT AUTO_INCREMENT PRIMARY KEY,
    uname VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 100000.00,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer'
);

-- Create CJWT Table (Token Revocation/Allowlist)
CREATE TABLE IF NOT EXISTS CJWT (
    tid INT AUTO_INCREMENT PRIMARY KEY,
    token TEXT,
    cid INT,
    exp DATETIME,
    FOREIGN KEY (cid) REFERENCES Customer(cid) ON DELETE CASCADE
);
