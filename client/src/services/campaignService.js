import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/servicemanagement', // Matches server.js mounting
});

// Add JWT token for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createCampaign = async (searchQuery = '') => {
  return await api.get('/services', { params: { search: searchQuery } });
};

export const getCampaigns = async (searchQuery = '') => {
  return await api.get('/services', { params: { search: searchQuery } });
};

export const getServices = async (searchQuery = '') => {
  return await api.get('/services', { params: { search: searchQuery } });
};