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
  },

  async getEventOrder(id) {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: CONFIG.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event order:', error);
      throw error;
    }
  },

  async updateEventOrder(id, data) {
    try {
      const response = await axios.put(`${API_URL}/orders/${id}`, data, {
        headers: CONFIG.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating event order:', error);
      throw error;
    }
  },

  async deleteEventOrder(id) {
    try {
      await axios.delete(`${API_URL}/orders/${id}`, {
        headers: CONFIG.headers,
      });
    } catch (error) {
      console.error('Error deleting event order:', error);
      throw error;
    }
  },
};
