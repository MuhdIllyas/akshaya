import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/servicemanagement',
});

// Add JWT token for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all services
export const getServices = async (searchQuery = '') => {
  return await api.get('/services', { params: { search: searchQuery } });
};

// Create a new service
export const createService = async (serviceData) => {
  return await api.post('/services', serviceData);
};

// Update a service
export const updateService = async (id, serviceData) => {
  return await api.put(`/services/${id}`, serviceData);
};

// Delete a service
export const deleteService = async (id) => {
  return await api.delete(`/services/${id}`);
};

// Add a subcategory
export const addSubcategory = async (serviceId, subcategoryData) => {
  return await api.post(`/services/${serviceId}/subcategories`, subcategoryData);
};

// Delete a subcategory
export const deleteSubcategory = async (serviceId, subId) => {
  return await api.delete(`/services/${serviceId}/subcategories/${subId}`);
};

// Get all wallets
export const getWallets = async () => {
  return await axios.get('http://localhost:5000/api/wallet/wallets', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
};

export default api;