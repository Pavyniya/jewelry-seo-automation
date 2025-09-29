import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

// Mock API
jest.mock('@/services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn()
  }
}));

const mockApi = require('@/services/api').api;

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('login', () => {
    it('should login successfully and set user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      const mockResponse = {
        data: {
          user: mockUser,
          token: 'mock-token'
        }
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('mock-token');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle login error', async () => {
      const error = new Error('Invalid credentials');
      mockApi.post.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.login('test@example.com', 'wrong-password'))
          .rejects.toThrow('Invalid credentials');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout and clear user data', () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        });
        result.current.setToken('mock-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      const updatedUser = {
        ...mockUser,
        name: 'Updated Name'
      };

      mockApi.put.mockResolvedValue({ data: updatedUser });

      const { result } = renderHook(() => useAuthStore());

      // Set initial user
      act(() => {
        result.current.setUser(mockUser);
        result.current.setToken('mock-token');
      });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', { name: 'Updated Name' });
    });
  });

  describe('checkAuth', () => {
    it('should check authentication status with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      mockApi.get.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      // Set token
      act(() => {
        result.current.setToken('mock-token');
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    });

    it('should handle invalid token', async () => {
      mockApi.get.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthStore());

      // Set token
      act(() => {
        result.current.setToken('invalid-token');
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should show loading state during login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      const mockResponse = {
        data: {
          user: mockUser,
          token: 'mock-token'
        }
      };

      mockApi.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockResponse), 100);
      }));

      const { result } = renderHook(() => useAuthStore());

      let loginPromise;
      act(() => {
        loginPromise = result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('selectors', () => {
    it('should return correct user role', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        });
      });

      expect(result.current.userRole).toBe('admin');
    });

    it('should return correct user permissions', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          permissions: ['read:products', 'write:products']
        });
      });

      expect(result.current.permissions).toEqual(['read:products', 'write:products']);
    });

    it('should check if user has specific permission', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          permissions: ['read:products', 'write:products']
        });
      });

      expect(result.current.hasPermission('read:products')).toBe(true);
      expect(result.current.hasPermission('delete:products')).toBe(false);
    });

    it('should return true for admin users', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        });
      });

      expect(result.current.isAdmin).toBe(true);
    });
  });
});