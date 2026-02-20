import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Relative path for proxy/rewrite
    withCredentials: true // Important: cookies
});

export default api;
