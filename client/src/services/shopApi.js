// src/services/shopApi.js
import api from './api';

export const shopApi = {
  // 코인 조회
  getCoins: async (userId) => {
    const res = await api.get(`/users/${userId}/coins`);
    return res.data; // { coins: number }
  },

  // 보유 아이템 조회
  getOwnedItems: async (userId) => {
    const res = await api.get(`/users/${userId}/items`);
    return res.data; // { items: [{ itemId, purchasedAt }] }
  },

  // 구매 요청
  purchaseItem: async ({ userId, itemId, price }) => {
    const res = await api.post('/shop/purchase', { userId, itemId, price });
    return res.data;
  },
};