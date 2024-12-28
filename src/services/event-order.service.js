import axios from 'axios';

import { CONFIG } from 'src/config-global';

const API_URL = 'http://127.0.0.1:8000/api';

export const EventOrderService = {
  async getEventOrders() {
    try {
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: CONFIG.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event orders:', error);
      throw error;
    }
  }
};
