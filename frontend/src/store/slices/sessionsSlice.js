import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionService from '../../services/sessionService';
import { toast } from 'react-toastify';

/**
 * Sessions Slice
 * Manages session state and operations
 */

// Async thunks for session operations
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sessionService.getAllSessions();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch sessions';
      return rejectWithValue(message);
    }
  }
);

export const fetchSessionById = createAsyncThunk(
  'sessions/fetchSessionById',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessionById(sessionId);
      return response.data.session;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch session';
      return rejectWithValue(message);
    }
  }
);

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await sessionService.createSession(sessionData);
      toast.success('Session created successfully!');
      return response.data.session;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create session';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateSession = createAsyncThunk(
  'sessions/updateSession',
  async ({ sessionId, sessionData }, { rejectWithValue }) => {
    try {
      const response = await sessionService.updateSession(sessionId, sessionData);
      toast.success('Session updated successfully!');
      return response.data.session;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update session';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteSession = createAsyncThunk(
  'sessions/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await sessionService.deleteSession(sessionId);
      toast.success('Session deleted successfully!');
      return sessionId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete session';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const joinSession = createAsyncThunk(
  'sessions/joinSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await sessionService.joinSession(sessionId);
      toast.success('Successfully joined session!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join session';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  sessions: [],
  selectedSession: null,
  upcomingSessions: [],
  pastSessions: [],
  isLoading: false,
  error: null,
  totalSessions: 0,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedSession: (state) => {
      state.selectedSession = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    filterSessions: (state) => {
      const now = new Date();
      state.upcomingSessions = state.sessions.filter(
        session => new Date(session.date_time) > now
      );
      state.pastSessions = state.sessions.filter(
        session => new Date(session.date_time) <= now
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.sessions;
        state.totalSessions = action.payload.count;
        
        // Filter sessions by time
        const now = new Date();
        state.upcomingSessions = state.sessions.filter(
          session => new Date(session.date_time) > now
        );
        state.pastSessions = state.sessions.filter(
          session => new Date(session.date_time) <= now
        );
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Session By ID
      .addCase(fetchSessionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSession = action.payload;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Session
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const newSession = action.payload;
        state.sessions.unshift(newSession);
        state.totalSessions += 1;
        
        // Update filtered sessions
        const now = new Date();
        if (new Date(newSession.date_time) > now) {
          state.upcomingSessions.unshift(newSession);
        } else {
          state.pastSessions.unshift(newSession);
        }
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Session
      .addCase(updateSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSession = action.payload;
        const index = state.sessions.findIndex(session => session.id === updatedSession.id);
        if (index !== -1) {
          state.sessions[index] = updatedSession;
        }
        state.selectedSession = updatedSession;
        
        // Update filtered sessions
        const now = new Date();
        state.upcomingSessions = state.sessions.filter(
          session => new Date(session.date_time) > now
        );
        state.pastSessions = state.sessions.filter(
          session => new Date(session.date_time) <= now
        );
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Session
      .addCase(deleteSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedSessionId = action.payload;
        state.sessions = state.sessions.filter(session => session.id !== deletedSessionId);
        state.upcomingSessions = state.upcomingSessions.filter(session => session.id !== deletedSessionId);
        state.pastSessions = state.pastSessions.filter(session => session.id !== deletedSessionId);
        state.totalSessions -= 1;
        
        if (state.selectedSession?.id === deletedSessionId) {
          state.selectedSession = null;
        }
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Join Session
      .addCase(joinSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinSession.fulfilled, (state, action) => {
        state.isLoading = false;
        // Optionally update session data or handle redirect
      })
      .addCase(joinSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedSession, setLoading, filterSessions } = sessionsSlice.actions;
export default sessionsSlice.reducer;