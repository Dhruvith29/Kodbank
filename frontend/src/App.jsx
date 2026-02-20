import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from './api';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ uname: '', password: '', email: '', phone: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/register', form);
            navigate('/login');
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
                <h2 className="text-xl mb-4">Register</h2>
                <input className="block w-full mb-2 p-2 border" placeholder="Username" onChange={e => setForm({ ...form, uname: e.target.value })} />
                <input className="block w-full mb-2 p-2 border" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
                <input className="block w-full mb-2 p-2 border" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
                <input className="block w-full mb-2 p-2 border" placeholder="Phone" onChange={e => setForm({ ...form, phone: e.target.value })} />
                <button className="w-full bg-blue-500 text-white p-2 rounded">Sign Up</button>
            </form>
        </div>
    );
};

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ uname: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/login', form);
            navigate('/dashboard');
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
                <h2 className="text-xl mb-4">Login</h2>
                <input className="block w-full mb-2 p-2 border" placeholder="Username" onChange={e => setForm({ ...form, uname: e.target.value })} />
                <input className="block w-full mb-2 p-2 border" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
                <button className="w-full bg-green-500 text-white p-2 rounded">Sign In</button>
            </form>
        </div>
    );
};

const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    const checkBalance = async () => {
        try {
            const res = await api.get('/getBalance');
            setBalance(res.data.balance);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } catch (err) { alert('Failed to fetch balance'); }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-purple-50">
            <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>
            <button onClick={checkBalance} className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition">
                Check Balance
            </button>
            {balance !== null && (
                <div className="mt-8 text-2xl font-mono animate-bounce text-green-700">
                    Your balance is : {balance}
                </div>
            )}
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Link to="/login">Go to Login</Link>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
