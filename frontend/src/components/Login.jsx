import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [formData, setFormData] = useState({ uname: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/login', formData);
            // Redirect to dashboard on success
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Kodbank Login</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="uname" placeholder="Username" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Sign In</button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Don't have an account? <Link to="/register" className="text-green-500">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
