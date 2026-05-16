import client from './client';

export const getOrders = (params) => client.get('/orders', { params });
export const getOrder = (id) => client.get(`/orders/${id}`);
export const checkout = (data) => client.post('/orders/checkout', data);
export const cancelOrder = (id) => client.post(`/orders/${id}/cancel`);
