import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  summary: { item_count: 0, subtotal: '0.00', requires_prescription: false },

  setCart: (items, summary) => set({ items, summary }),

  clearCart: () => set({
    items: [],
    summary: { item_count: 0, subtotal: '0.00', requires_prescription: false }
  }),
}));

export default useCartStore;
