'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { StoreSettings, User, UserRole } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Store, 
  Receipt, 
  Users, 
  Plus, 
  Check, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  Save, 
  Loader2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const COMMON_CURRENCIES = [
  { symbol: '$', code: 'USD', label: '$ (US Dollar / CAD / AUD)' },
  { symbol: 'LKR', code: 'LKR', label: 'LKR (Sri Lankan Rupee)' },
  { symbol: 'Rs.', code: 'LKR', label: 'Rs. (Rupees)' },
  { symbol: '₹', code: 'INR', label: '₹ (Indian Rupee)' },
  { symbol: '€', code: 'EUR', label: '€ (Euro)' },
  { symbol: '£', code: 'GBP', label: '£ (British Pound)' },
  { symbol: 'AED', code: 'AED', label: 'AED (Emirati Dirham)' },
  { symbol: '¥', code: 'JPY', label: '¥ (Japanese Yen)' },
];

export default function SettingsPage() {
  const { settings, updateSettings, formatMoney } = useSettings();
  const { isAdmin, usersList, refreshUsers, openSwitchModal } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'shop' | 'users'>('shop');

  // Shop Settings Form State
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // User Management State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CASHIER');
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Handle Save Store Settings
  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const success = await updateSettings(formData);
    setIsSavingSettings(false);
    if (success) {
      toast('Store settings and currency updated successfully!', 'success');
    } else {
      toast('Failed to save settings', 'error');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPin.trim()) {
      toast('All fields are required', 'error');
      return;
    }

    if (newUserPin.trim().length < 4) {
      toast('PIN must be at least 4 digits', 'error');
      return;
    }

    setIsSavingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          pin: newUserPin.trim(),
          role: newUserRole,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(`User "${newUserName}" created!`, 'success');
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPin('');
        setNewUserRole('CASHIER');
        setIsAddUserModalOpen(false);
        refreshUsers();
      } else {
        toast(data.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      toast('Network error creating user', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle Toggle User Active
  const handleToggleUserActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`User status updated to ${!user.isActive ? 'Active' : 'Inactive'}`, 'success');
        refreshUsers();
      } else {
        toast(data.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      toast('Error updating user', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast('Staff member deleted', 'success');
        refreshUsers();
      } else {
        toast(data.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      toast('Error deleting user', 'error');
    }
  };

  // Admin Access Guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-display">Administrator Access Required</h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          Settings, currency configurations, and staff management are restricted to store managers.
        </p>
        <button
          onClick={openSwitchModal}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition-all font-display"
        >
          Switch to Admin Shift
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Store Configuration & Settings</span>
            <SettingsIcon className="w-6 h-6 text-pink-500" />
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure boutique metadata, currency symbols, and staff cashier accounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'shop'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shop & Currency</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Cashiers ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SHOP & CURRENCY SETTINGS */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Configuration Column */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
            {/* Currency Setup Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border border-pink-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-stone-900 text-sm font-display">
                    Currency Symbol & Formatting
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-600 text-white">
                  Active: {formData.currencySymbol || '$'}
                </span>
              </div>

              {/* Quick Pick Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {COMMON_CURRENCIES.map((c) => {
                  const isSelected = formData.currencySymbol === c.symbol;
                  return (
                    <button
                      key={c.symbol + c.code}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          currencySymbol: c.symbol,
                          currencyCode: c.code,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Currency Symbol Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Currency Symbol (e.g. Rs. / LKR / $)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.currencySymbol}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, currencySymbol: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-300 font-mono font-bold text-sm text-stone-900 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Currency Code (e.g. LKR, USD, EUR)
                  </label>
                  <input
                    type="text"
                    value={formData.currencyCode}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, currencyCode: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-300 font-mono font-bold text-sm text-stone-900 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Shop Metadata */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-sm font-display flex items-center gap-2 border-b border-stone-100 pb-2">
                <Store className="w-4 h-4 text-stone-500" />
                <span>Shop Profile & Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shopName: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Shop Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.shopTagline || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, shopTagline: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Store Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Store Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Store Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Default Tax Rate (e.g. 0.08 for 8%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono font-medium focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Thermal Receipt Text Customization */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-stone-900 text-sm font-display flex items-center gap-2 border-b border-stone-100 pb-2">
                <Receipt className="w-4 h-4 text-stone-500" />
                <span>Thermal Bill Text & Custom Notes</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={formData.receiptFooter}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, receiptFooter: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Return Policy / Warranty Note
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptNote || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, receiptNote: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all font-display"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Price & Receipt Preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Live Currency Sample
                </h3>
              </div>

              <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Sample Item (1x):</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatMoney(24.99)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Discount (10%):</span>
                  <span className="font-mono text-rose-600 font-medium">
                    -{formatMoney(2.50)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-rose-600 font-extrabold text-sm">
                    {formatMoney(24.29)}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Preview Miniature */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs font-mono text-[10px] leading-tight text-stone-800">
              <div className="text-center pb-2 border-b border-dashed border-stone-400">
                <div className="font-bold text-xs uppercase text-stone-900">
                  {formData.shopName || 'Store Name'}
                </div>
                <div className="text-[9px] text-stone-600">{formData.address}</div>
                <div className="text-[9px] text-stone-600">Tel: {formData.phone}</div>
              </div>

              <div className="py-2 space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Receipt #:</span>
                  <span className="font-bold">BB-SAMPLE-001</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Cashier:</span>
                  <span className="font-bold">Emma Harrison</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1">
                  <span>TOTAL:</span>
                  <span>{formatMoney(45.00)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] text-stone-600 border-t border-dashed border-stone-400">
                <p className="font-semibold">{formData.receiptFooter}</p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: USER & CASHIER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Staff Accounts & Cashier Shifts
              </h3>
              <p className="text-xs text-stone-500">
                Manage login PINs, role permissions (Admin vs Cashier), and active cashier accounts.
              </p>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all font-display"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee Name</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Access Role</th>
                  <th className="py-3.5 px-4 text-center">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-stone-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 font-bold flex items-center justify-center font-display">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          Added {new Date(u.createdAt || '').toLocaleDateString()}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      @{u.username}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'ADMIN' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-stone-900 text-base font-display mb-1">
              Add New Staff Member
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Set up employee name, terminal username, and numeric security PIN.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jessica Taylor"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Username (for terminal identification) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. jessica"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  4-Digit Security PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-sm font-mono tracking-widest focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Role Permission
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold focus:border-rose-500"
                >
                  <option value="CASHIER">CASHIER (POS Billing Only)</option>
                  <option value="ADMIN">ADMIN (Full System & Inventory Access)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all font-display"
                >
                  {isSavingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
