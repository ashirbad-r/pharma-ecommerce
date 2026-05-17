import client from './client';

export const login = (data) => client.post('/auth/login', data);
export const getDashboardStats = () => Promise.all([
  client.get('/orders'),
  client.get('/products'),
  client.get('/orders?status=pending'),
]);
export const getOrders = (params) => client.get('/orders', { params });
export const getOrder = (id) => client.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => client.patch(`/orders/${id}/status`, { status });
export const getProducts = (params) => client.get('/products', { params });
export const createProduct = (data) => client.post('/products', data);
export const updateProduct = (id, data) => client.put(`/products/${id}`, data);
export const deleteProduct = (id) => client.delete(`/products/${id}`);
export const getUsers = () => client.get('/auth/users');
export const getPrescriptions = (params) => client.get('/prescriptions', { params });
export const verifyPrescription = (id, action) => client.patch(`/prescriptions/${id}/verify`, { action });
