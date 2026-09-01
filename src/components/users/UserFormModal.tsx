'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { 
  X, 
  User as UserIcon, 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Check, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<boolean>;
  initialUser?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSave,
  initialUser,
}: UserFormModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = !!initialUser;

  useEffect(() => {
    if (isOpen) {
      if (initialUser) {
        setName(initialUser.name || '');
        setUsername(initialUser.username || '');
        setPassword('');
        setPin(initialUser.pin || '');
        setRole(initialUser.role || 'CASHIER');
        setIsActive(initialUser.isActive ?? true);
      } else {
        setName('');
        setUsername('');
        setPassword('');
        setPin('1234');
        setRole('CASHIER');
        setIsActive(true);
      }
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username is required');
      return;
    }
    if (!isEdit && !password.trim()) {
      setErrorMsg('Password is required for new accounts');
      return;
    }

    setIsSaving(true);
    const payload: Partial<User> = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      isActive,
      ...(password.trim() && { password: password.trim() }),
      ...(pin.trim() && { pin: pin.trim() }),
    };

    const success = await onSave(payload);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {isEdit ? 'Edit System Account' : 'Create New User Account'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEdit
                  ? 'Update user role, name, or account access'
                  : 'Add a new cashier or administrator account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="e.g. cashier1"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono focus:border-rose-500"
            />
          </div>

          {/* Password (Optional in Edit, Required in Create) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isEdit ? 'New Password (Leave empty to keep current)' : 'Password'} {!isEdit && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required={!isEdit}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Enter login password'}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Account Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('CASHIER')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'CASHIER'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-950 shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs font-display">
                  <span>Cashier Role</span>
                  {role === 'CASHIER' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                  Restricted strictly to the POS terminal billing screen.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'ADMIN'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs font-display">
                  <span>Admin Role</span>
                  {role === 'ADMIN' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                  Full system access (Inventory, Reports, Settings, Users).
                </p>
              </button>
            </div>
          </div>

          {/* Active Status */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-800">Account Active</span>
              <p className="text-[11px] text-stone-500">Allow user to log in and conduct sales</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                isActive ? 'bg-rose-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all font-display"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Account...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Account' : 'Create User'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
