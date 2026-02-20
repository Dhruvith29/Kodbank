const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecret_kodbank_key_2026';

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'https://kodbank.vercel.app'], // Allow local + Vercel
    credentials: true
}));

app.get('/', (req, res) => res.send('Kodbank Backend Running'));

// 1. POST /register
app.post('/register', async (req, res) => {
    try {
        const { uname, password, email, phone } = req.body;
        if (!uname || !password) return res.status(400).json({ message: 'Missing fields' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO Customer (uname, password, email, phone) VALUES (?, ?, ?, ?)',
            [uname, hashedPassword, email, phone]
        );
        res.status(201).json({ message: 'User registered', cid: result.insertId });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username taken' });
        res.status(500).json({ message: 'Server Error' });
    }
});

// 2. POST /login
app.post('/login', async (req, res) => {
    try {
        const { uname, password } = req.body;
        const [users] = await db.query('SELECT * FROM Customer WHERE uname = ?', [uname]);

        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        // Generate JWT
        const token = jwt.sign(
            { sub: user.uname, role: user.role }, // Subject: uname, Claim: role
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Store in CJWT
        const expDate = new Date(Date.now() + 3600000);
        await db.query('INSERT INTO CJWT (token, cid, exp) VALUES (?, ?, ?)', [token, user.cid, expDate]);

        // Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 3600000
        });

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 3. GET /getBalance
app.get('/getBalance', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'No token' });

        // Verify Signature
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // Verify Database Existence (Strict Stateless)
        const [tokens] = await db.query('SELECT * FROM CJWT WHERE token = ? AND exp > NOW()', [token]);
        if (tokens.length === 0) return res.status(401).json({ message: 'Token revoked/expired' });

        // Fetch Balance using extracted uname (decoded.sub)
        const [users] = await db.query('SELECT balance FROM Customer WHERE uname = ?', [decoded.sub]);

        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json({ balance: users[0].balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Vercel Export
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
