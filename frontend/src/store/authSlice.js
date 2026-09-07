// Authentication state for the Kormopulse client.
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => { state.loading = true; },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.userData = action.payload;
    },
    loginFailure: (state) => { state.loading = false; },
    logout: (state) => {
      state.userData = null;
      state.loading = false;
    },
    setLoadingFalse: (state) => {
      state.loading = false;
    },
    updateUser: (state, action) => {
      state.userData = action.payload;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setLoadingFalse, updateUser } = authSlice.actions;
export default authSlice.reducer;
