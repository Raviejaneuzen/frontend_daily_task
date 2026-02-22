import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'https://backend-daily-task.onrender.com';

const api = axios.create({
  baseURL: rawUrl.replace(/\/+$/, ''),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
