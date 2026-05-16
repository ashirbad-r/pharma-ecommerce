import client from './client';

export const getCart = () => client.get('/cart');
export const addToCart = (data) => client.post('/cart', data);
export const updateCartItem = (productId, data) => client.put(`/cart/${productId}`, data);
export const removeFromCart = (productId) => client.delete(`/cart/${productId}`);
export const clearCart = () => client.delete('/cart');
