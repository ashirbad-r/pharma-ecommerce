import client from './client';

export const getAddresses = () => client.get('/addresses');
export const addAddress = (data) => client.post('/addresses', data);
export const updateAddress = (id, data) => client.put(`/addresses/${id}`, data);
export const deleteAddress = (id) => client.delete(`/addresses/${id}`);
export const setDefaultAddress = (id) => client.patch(`/addresses/${id}/default`);
