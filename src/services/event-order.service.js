import axios from 'axios';

import { CONFIG, ENDPOINTS } from 'src/config-global';

export const EventOrderService = {
  async getEventOrders() {
    try {
      const response = await axios.get(ENDPOINTS.API_EVENT_ORDER_URL, {
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
      const response = await axios.get(`${ENDPOINTS.API_EVENT_ORDER_URL}/${id}`, {
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
      const response = await axios.put(`${ENDPOINTS.API_EVENT_ORDER_URL}/${id}`, data, {
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
      await axios.delete(`${ENDPOINTS.API_EVENT_ORDER_URL}/${id}`, {
        headers: CONFIG.headers,
      });
    } catch (error) {
      console.error('Error deleting event order:', error);
      throw error;
    }
  },

  async verifyQrCode(qrCode) {
    try {
      const response = await axios.post(`${CONFIG.apiUrl}/api/verify-qrcode`, {
        qr_code: qrCode
      }, {
        headers: CONFIG.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying QR code:', error);
      throw error;
    }
  },
};
