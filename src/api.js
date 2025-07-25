import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const register = (data) => axios.post(`${API_URL}/register`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const fetchTree = (token) => axios.get(`${API_URL}/family/tree`, { headers: { Authorization: `Bearer ${token}` } });
export const addMember = (data, token) => axios.post(`${API_URL}/family/add`, data, { headers: { Authorization: `Bearer ${token}` } }); 