'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, CartItem } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  User as UserIcon, 
  LogOut, 
  ShoppingBag, 
  Delete, 
  Eye, 
  EyeOff, 
  KeyRound,
  RotateCcw
} from 'lucide-react';

interface ScreenLockModalProps {
  isOpen: boolean;
  user: User | null;
  cart: CartItem[];
  customerName?: string;
  onUnlock: () => void;
  onSwitchUser?: () => void;
  onLogout: () => void;
}

export default function ScreenLockModal({
  isOpen,
  user,
  cart,
  customerName,
  onUnlock,
  onSwitchUser,
  onLogout,
}: ScreenLockModalProps) {
  const { formatMoney } = useSettings();
  const [credential, setCredential] = useState<string>('');
  const [showCredential, setShowCredential] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [keypadMode, setKeypadMode] = useState<'pin' | 'password'>('pin');

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCredential('');
      setErrorMsg('');
      setIsVerifying(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Cart preservation metrics
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'clear') {
      setCredential('');
    } else if (val === 'backspace') {
      setCredential((prev) => prev.slice(0, -1));
    } else {
      if (credential.length < 20) {
        setCredential((prev) => prev + val);
      }
    }
  };

  const handleVerifyUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!credential.trim()) {
      setErrorMsg('Please enter your PIN or Password to unlock');
      return;
    }

    if (!user) {
      setErrorMsg('No active user session found. Please log in.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMsg('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: credential.trim(),
          pin: credential.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        setCredential('');
        setErrorMsg('');
        onUnlock();
      } else {
        setErrorMsg(data.error || 'Incorrect PIN or Password. Please try again.');
        setCredential('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setErrorMsg('Network error verifying credentials. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Top Security Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 border border-pink-200 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10 animate-bounce">
              <Lock className="w-8 h-8" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white" />
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display tracking-tight">
              POS Register Locked
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Screen locked due to inactivity. Enter credentials to resume.
            </p>
          </div>
        </div>

        {/* Current Active User Badge */}
        {user && (
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-bold text-stone-900 text-sm font-display leading-tight">
                  {user.name}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  @{user.username} &bull; <span className="font-semibold text-rose-600">{user.role}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Logout & return to login screen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preserved Active Cart Banner */}
        {totalCartItems > 0 && (
          <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <div className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-stone-900">
                  Active Cart Preserved:
                </span>
                <div className="text-[11px] text-stone-500">
                  {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} &bull; {customerName || 'Walk-in'}
                </div>
              </div>
            </div>
            <div className="text-right font-mono font-black text-rose-600 text-sm">
              {formatMoney(totalCartValue)}
            </div>
          </div>
        )}

        {/* Credential Verification Form */}
        <form onSubmit={handleVerifyUnlock} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Password / PIN Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                <span>Enter Password or 4-6 Digit PIN:</span>
              </label>
              <button
                type="button"
                onClick={() => setKeypadMode(keypadMode === 'pin' ? 'password' : 'pin')}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-semibold"
              >
                {keypadMode === 'pin' ? 'Show Full Keyboard' : 'Show Touch Numpad'}
              </button>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type={showCredential ? 'text' : 'password'}
                required
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                className="w-full pl-4 pr-11 py-3 bg-stone-50 focus:bg-white rounded-2xl border border-stone-200 text-center text-lg font-mono tracking-widest font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowCredential(!showCredential)}
                className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title={showCredential ? 'Hide characters' : 'Show characters'}
              >
                {showCredential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Touchscreen PIN Keypad */}
          {keypadMode === 'pin' && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-3 bg-stone-100 hover:bg-stone-200 active:scale-[0.97] rounded-xl text-base font-black font-mono text-stone-800 transition-all shadow-2xs cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.97] rounded-xl text-xs font-bold text-stone-600 transition-all shadow-2xs cursor-pointer"
                title="Clear all digits"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-stone-100 hover:bg-stone-200 active:scale-[0.97] rounded-xl text-base font-black font-mono text-stone-800 transition-all shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.97] rounded-xl text-xs font-bold text-stone-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isVerifying || !credential.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all font-display cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Unlocking Register...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock POS Register</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              {onSwitchUser && (
                <button
                  type="button"
                  onClick={onSwitchUser}
                  className="text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Switch Cashier</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="text-stone-400 hover:text-rose-600 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
