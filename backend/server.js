const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_kodbank'; // In prod, use .env

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'https://kodbank.vercel.app'], // Add your Vercel domain here
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Kodbank Backend is Running');
});

// --- Routes (Prefixed with /api for Vercel) ---

// 1. POST /api/register
app.post('/api/register', async (req, res) => {
    try {
        const { uname, password, email, phone } = req.body;

        // Basic validation
        if (!uname || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into DB
        const [result] = await db.query(
            'INSERT INTO Customer (uname, password, email, phone) VALUES (?, ?, ?, ?)',
            [uname, hashedPassword, email, phone]
        );

        res.status(201).json({ message: 'User registered successfully', cid: result.insertId });

    } catch (error) {
        console.error('Register Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { uname, password } = req.body;

        // Find user
        const [users] = await db.query('SELECT * FROM Customer WHERE uname = ?', [uname]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        // Strict Stateless Requirement: The token itself contains the necessary claims.
        // However, we also store it in DB for revocation checks (allowlist).
        const token = jwt.sign(
            { sub: user.uname, cid: user.cid, role: user.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Store token in CJWT table (Strict Compliance)
        // Calculate expiry timestamp for MySQL
        const expDate = new Date(Date.now() + 3600000); // 1 hour from now

        await db.query(
            'INSERT INTO CJWT (token, cid, exp) VALUES (?, ?, ?)',
            [token, user.cid, expDate]
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // True in prod (Vercel)
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // None for cross-site (if needed) or distinct domains
            maxAge: 3600000 // 1 hour
        });

        res.json({ message: 'Login successful' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. GET /api/getBalance
app.get('/api/getBalance', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // 1. Verify Signature
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token signature' });
        }

        // 2. Strict Stateless Protocol Check: Verify token exists in CJWT table
        const [tokens] = await db.query(
            'SELECT * FROM CJWT WHERE token = ? AND exp > NOW()',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(401).json({ message: 'Token invalid or expired (Revoked)' });
        }

        // 3. Fetch Balance
        // We can use decoded.cid or decoded.sub (uname) to fetch.
        // Using cid is generally faster/cleaner if available in token.
        const [users] = await db.query('SELECT balance FROM Customer WHERE cid = ?', [decoded.cid]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ balance: users[0].balance });

    } catch (error) {
        console.error('GetBalance Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export for Vercel
module.exports = app;

// Only listen if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
