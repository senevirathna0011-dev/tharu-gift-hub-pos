'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';

interface AuthContextType {
  currentUser: User | null;
  usersList: User[];
  isAdmin: boolean;
  isCashier: boolean;
  isLoading: boolean;
  isSwitchModalOpen: boolean;
  openSwitchModal: () => void;
  closeSwitchModal: () => void;
  isChangePasswordOpen: boolean;
  openChangePasswordModal: () => void;
  closeChangePasswordModal: () => void;
  loginWithPassword: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  switchUserDirect: (user: User) => void;
  refreshUsers: () => Promise<User[]>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsersList(data.users);
        return data.users;
      }
    } catch (err) {
      console.error('Failed to load user list:', err);
    }
    return [];
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const loadedUsers = await refreshUsers();

      // Check saved session in localStorage
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('pos_active_user_id') : null;
      if (savedUserId && loadedUsers.length > 0) {
        const found = loadedUsers.find((u: User) => u.id === savedUserId);
        if (found && found.isActive) {
          setCurrentUser(found);
          setIsLoading(false);
          return;
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('pos_active_user_id');
        }
      }

      // No active session -> require login (no automatic bypass/fallback)
      setCurrentUser(null);
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUsers]);

  // Role-Based Route Guarding
  useEffect(() => {
    if (isLoading) return;

    // Allow public unauthenticated routes (/login, /catalog)
    const isPublicRoute = pathname === '/login' || pathname.startsWith('/catalog');
    if (!currentUser && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Cashier Role restriction: ONLY allowed on /pos
    if (currentUser && currentUser.role === 'CASHIER') {
      const restrictedPrefixes = ['/inventory', '/customers', '/suppliers', '/sales', '/reports', '/analytics', '/settings', '/users'];
      const isRestricted = restrictedPrefixes.some((p) => pathname.startsWith(p));
      if (isRestricted) {
        router.push('/pos');
      }
    }
  }, [currentUser, isLoading, pathname, router]);

  const loginWithPassword = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_active_user_id', data.user.id);
        }
        setIsSwitchModalOpen(false);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      return { success: false, error: 'Authentication network error' };
    }
  };

  const loginWithPin = async (
    username: string,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    return loginWithPassword(username, pin);
  };

  const switchUserDirect = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_active_user_id', user.id);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_active_user_id');
    }
    setCurrentUser(null);
    router.push('/login');
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isCashier = currentUser?.role === 'CASHIER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        isAdmin,
        isCashier,
        isLoading,
        isSwitchModalOpen,
        openSwitchModal: () => setIsSwitchModalOpen(true),
        closeSwitchModal: () => setIsSwitchModalOpen(false),
        isChangePasswordOpen,
        openChangePasswordModal: () => setIsChangePasswordOpen(true),
        closeChangePasswordModal: () => setIsChangePasswordOpen(false),
        loginWithPassword,
        loginWithPin,
        switchUserDirect,
        refreshUsers,
        logout,
      }}
    >
      {children}

      {/* Global Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        targetUserId={currentUser?.id}
        targetUserName={currentUser?.name}
        isAdminReset={false}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
