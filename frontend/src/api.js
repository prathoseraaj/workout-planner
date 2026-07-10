import axios from 'axios';

// In production (Vercel) set VITE_API_URL to the deployed backend URL.
// Locally the Vite dev-server proxy forwards /api → localhost:8000.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
});

export const checkUserExists  = ()           => api.get('/user/exists');
export const getUser          = ()           => api.get('/user');
export const setupUser        = (data)       => api.post('/user/setup', data);
export const generateWorkout  = (body = {}) => api.post('/generate', body);
export const getHistory       = ()           => api.get('/history');
export const getExercises     = ()           => api.get('/exercises');
export const debugBitmask     = ()           => api.get('/debug/bitmask');
export const deleteUser       = ()           => api.delete('/user');

export default api;
