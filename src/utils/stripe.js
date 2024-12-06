import axios from 'axios';

const API_URL = import.meta.env.VITE_DEV === 'true'
  ? import.meta.env.VITE_SERVER_URL_DEV
  : import.meta.env.VITE_SERVER_URL_PROD;

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

const headers = {
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export const stripeService = {
  createEvent: async (name, price) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/stripe/create-event`,
        {
          name,
          price: Number(price),
        },
        { headers }
      );

      if (!response.data) {
        throw new Error('No data received from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating Stripe event:', error);
      throw new Error(error.response?.data?.message || 'Failed to create Stripe event');
    }
  },

  updateEvent: async (eventId, name, price) => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const response = await axios.put(
        `${API_URL}/api/stripe/update-event/${eventId}`,
        {
          name,
          price: Number(price),
        },
        { headers }
      );

      if (!response.data) {
        throw new Error('No data received from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating Stripe event:', error);
      throw new Error(error.response?.data?.message || 'Failed to update Stripe event');
    }
  },

  deleteEvent: async (eventId) => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const response = await axios.delete(
        `${API_URL}/api/stripe/delete-event/${eventId}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error deleting Stripe event:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete Stripe event');
    }
  }
};
