import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import sessionsReducer from './slices/sessionsSlice';
import attendanceReducer from './slices/attendanceSlice';

/**
 * Redux Store Configuration
 * Centralizes all application state management
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    sessions: sessionsReducer,
    attendance: attendanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;