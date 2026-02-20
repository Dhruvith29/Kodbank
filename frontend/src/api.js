import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Relative for Vercel Rewrites
    withCredentials: true
});

export default api;
