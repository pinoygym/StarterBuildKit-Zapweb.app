import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, LoginCredentials } from '../../services/auth/authService';
import { User, Branch } from '../../types';

interface AuthState {
  user: User | null;
  currentBranch: Branch | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  currentBranch: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const user = await authService.getCurrentUser();
  return user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentBranch: (state, action: PayloadAction<Branch>) => {
      state.currentBranch = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
        // Set default branch if available
        const user = action.payload.user as User;
        if (user.currentBranch) {
          // currentBranch is expected to be a Branch object, but User has it as string
          // For now, we'll leave it as null and handle branch selection separately
          state.currentBranch = null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.currentBranch = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          // Set current branch if available
          const user = action.payload as User;
          if (user.currentBranch) {
            // currentBranch is expected to be a Branch object, but User has it as string
            // For now, we'll leave it as null and handle branch selection separately
            state.currentBranch = null;
          }
        }
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.currentBranch = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCurrentBranch, clearError, setLoading } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: any) => state.auth.user;
export const selectCurrentBranch = (state: any) => state.auth.currentBranch;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: any) => state.auth.isLoading;
export const selectAuthError = (state: any) => state.auth.error;

export default authSlice.reducer;