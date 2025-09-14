import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import attendanceService from '../../services/attendanceService';
import { toast } from 'react-toastify';

/**
 * Attendance Slice
 * Manages attendance state and operations
 */

// Async thunks for attendance operations
export const fetchSessionAttendance = createAsyncThunk(
  'attendance/fetchSessionAttendance',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getSessionAttendance(sessionId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch session attendance';
      return rejectWithValue(message);
    }
  }
);

export const fetchStudentAttendance = createAsyncThunk(
  'attendance/fetchStudentAttendance',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getStudentAttendance(studentId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch student attendance';
      return rejectWithValue(message);
    }
  }
);

export const fetchAttendanceStats = createAsyncThunk(
  'attendance/fetchAttendanceStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendanceStats();
      return response.data.stats;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch attendance statistics';
      return rejectWithValue(message);
    }
  }
);

export const fetchTeacherAttendanceReport = createAsyncThunk(
  'attendance/fetchTeacherAttendanceReport',
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getTeacherAttendanceReport(teacherId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch teacher attendance report';
      return rejectWithValue(message);
    }
  }
);

export const updateAttendanceStatus = createAsyncThunk(
  'attendance/updateAttendanceStatus',
  async ({ attendanceId, status }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.updateAttendanceStatus(attendanceId, status);
      toast.success('Attendance status updated successfully!');
      return response.data.attendance;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update attendance status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  sessionAttendance: [],
  studentAttendance: [],
  teacherReport: [],
  stats: null,
  isLoading: false,
  error: null,
  currentSessionId: null,
  currentStudentId: null,
  currentTeacherId: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSessionAttendance: (state) => {
      state.sessionAttendance = [];
      state.currentSessionId = null;
    },
    clearStudentAttendance: (state) => {
      state.studentAttendance = [];
      state.currentStudentId = null;
    },
    clearTeacherReport: (state) => {
      state.teacherReport = [];
      state.currentTeacherId = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Session Attendance
      .addCase(fetchSessionAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionAttendance = action.payload.attendance;
        state.currentSessionId = action.payload.sessionId;
      })
      .addCase(fetchSessionAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Student Attendance
      .addCase(fetchStudentAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentAttendance = action.payload.attendance;
        state.currentStudentId = action.payload.studentId;
      })
      .addCase(fetchStudentAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Attendance Stats
      .addCase(fetchAttendanceStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAttendanceStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Teacher Attendance Report
      .addCase(fetchTeacherAttendanceReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendanceReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherReport = action.payload.report;
        state.currentTeacherId = action.payload.teacherId;
      })
      .addCase(fetchTeacherAttendanceReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Attendance Status
      .addCase(updateAttendanceStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAttendanceStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedAttendance = action.payload;
        
        // Update in session attendance if present
        const sessionIndex = state.sessionAttendance.findIndex(
          attendance => attendance.id === updatedAttendance.id
        );
        if (sessionIndex !== -1) {
          state.sessionAttendance[sessionIndex] = updatedAttendance;
        }
        
        // Update in student attendance if present
        const studentIndex = state.studentAttendance.findIndex(
          attendance => attendance.id === updatedAttendance.id
        );
        if (studentIndex !== -1) {
          state.studentAttendance[studentIndex] = updatedAttendance;
        }
      })
      .addCase(updateAttendanceStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSessionAttendance,
  clearStudentAttendance,
  clearTeacherReport,
  setLoading,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;