import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  totalUsers: 0,
  totalEvents: 0,
  totalOrders: 0,
  loading: false,
  error: null,
  weeklyStats: {
    users: [],
    events: [],
    orders: [],
  },
};

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    startLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setMetrics(state, action) {
      state.loading = false;
      state.totalUsers = action.payload.totalUsers;
      state.totalEvents = action.payload.totalEvents;
      state.totalOrders = action.payload.totalOrders;
    },
    setWeeklyStats(state, action) {
      state.loading = false;
      state.weeklyStats = action.payload;
    },
  },
});

// Sélecteurs
export const selectMetricsLoading = (state) => state.metrics.loading;
export const selectTotalUsers = (state) => state.metrics.totalUsers;
export const selectTotalEvents = (state) => state.metrics.totalEvents;
export const selectTotalOrders = (state) => state.metrics.totalOrders;
export const selectWeeklyStats = (state) => state.metrics.weeklyStats;

// Sélecteurs calculés
export const selectGrowthStats = (state) => {
  const calculateGrowth = (data = []) => {
    if (!data || data.length === 0) return 0;
    const total = data.length;
    const previousTotal = 10;
    return ((total - previousTotal) / previousTotal) * 100;
  };

  return {
    users: calculateGrowth(state.metrics.weeklyStats.users),
    events: calculateGrowth(state.metrics.weeklyStats.events),
    orders: calculateGrowth(state.metrics.weeklyStats.orders),
  };
};

export const selectWeeklyData = (state) => {
  const getWeeklyData = (data = []) => {
    const weekData = new Array(7).fill(0);
    if (data) {
      data.forEach((item) => {
        const date = new Date(item.date);
        const dayIndex = date.getDay();
        weekData[dayIndex] += item.value;
      });
    }
    return weekData;
  };

  return {
    users: getWeeklyData(state.metrics.weeklyStats.users),
    events: getWeeklyData(state.metrics.weeklyStats.events),
    orders: getWeeklyData(state.metrics.weeklyStats.orders),
  };
};

export const { startLoading, setError, setMetrics, setWeeklyStats } = metricsSlice.actions;

export default metricsSlice.reducer;
