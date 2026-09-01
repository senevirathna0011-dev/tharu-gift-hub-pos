'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/types';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  X, 
  Lock, 
  Delete, 
  KeyRound, 
  Loader2 
} from 'lucide-react';

export default function CashierSwitchModal() {
  const { 
    isSwitchModalOpen, 
    closeSwitchModal, 
    usersList, 
    currentUser, 
    loginWithPin 
  } = useAuth();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isSwitchModalOpen) return null;

  const activeUser = selectedUser || currentUser || usersList[0];

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPin('');
    setError('');
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeUser) return;
    if (!pin) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const result = await loginWithPin(activeUser.username, pin);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Incorrect PIN');
      setPin('');
    } else {
      setPin('');
      setSelectedUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/65 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Switch Shift / Cashier
              </h3>
              <p className="text-xs text-stone-500">Select employee profile and enter security PIN</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPin('');
              setError('');
              closeSwitchModal();
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* User Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Select Staff Member
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {usersList.map((u) => {
                const isSelected = activeUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`flex flex-col items-start p-2.5 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px] flex items-center justify-center font-display">
                        {u.name.charAt(0)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-stone-900 truncate w-full">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">@{u.username}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Display & Keypad */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-stone-600 flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                Enter PIN for <strong className="text-stone-900">{activeUser?.name}</strong>
              </span>
            </div>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 my-2 h-8">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      filled
                        ? 'bg-rose-600 scale-110 shadow-xs'
                        : 'border-2 border-stone-300 bg-white'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-bold mt-1 animate-shake">
                {error}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-11 rounded-xl bg-white hover:bg-rose-50 active:bg-rose-100 border border-stone-200 shadow-2xs font-bold text-base text-stone-800 transition-colors font-display"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-colors"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-11 rounded-xl bg-white hover:bg-rose-50 active:bg-rose-100 border border-stone-200 shadow-2xs font-bold text-base text-stone-800 transition-colors font-display"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => handleUnlock()}
            disabled={isSubmitting || pin.length < 4}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition-all font-display"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying PIN...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Unlock & Switch Shift</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
