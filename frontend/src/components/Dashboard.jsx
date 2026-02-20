import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const checkBalance = async () => {
        try {
            const res = await api.get('/getBalance');
            setBalance(res.data.balance);
            setError('');

            // Trigger confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch balance');
            if (err.response?.status === 401) {
                // Determine if we should redirect or just show error
                // For a strict dashboard, maybe redirect
                setTimeout(() => navigate('/login'), 2000);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="bg-white text-gray-800 p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
                <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    User Dashboard
                </h1>

                <div className="mb-8">
                    {balance !== null ? (
                        <div className="text-xl font-mono animate-bounce">
                            Your balance is : {balance}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Balance hidden</p>
                    )}
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                    onClick={checkBalance}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
                >
                    Check Balance
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
