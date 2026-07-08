import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const checkUserExists  = ()           => api.get('/user/exists');
export const getUser          = ()           => api.get('/user');
export const setupUser        = (data)       => api.post('/user/setup', data);
export const generateWorkout  = (body = {}) => api.post('/generate', body);
export const getHistory       = ()           => api.get('/history');
export const getExercises     = ()           => api.get('/exercises');
export const debugBitmask     = ()           => api.get('/debug/bitmask');

export default api;
