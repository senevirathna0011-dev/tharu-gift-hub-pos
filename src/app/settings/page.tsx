'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UserCheck,
  Upload,
  Image as ImageIcon,
  Eye,
  FileText,
  HelpCircle
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

  const [activeTab, setActiveTab] = useState<'shop' | 'receipt' | 'users'>('shop');

  // Store & Receipt Settings Form State
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
      toast('Store & invoice settings saved successfully!', 'success');
    } else {
      toast('Failed to save settings', 'error');
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Image file exceeds 5MB limit', 'error');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      if (resData.success && (resData.url || resData.imageUrl)) {
        const uploadedUrl = resData.url || resData.imageUrl;
        setFormData((prev) => ({
          ...prev,
          shopLogo: uploadedUrl,
        }));
        toast('Logo uploaded! Click "Save & Apply Settings" to commit.', 'success');
      } else {
        toast(resData.error || 'Failed to upload logo', 'error');
      }
    } catch (err) {
      toast('Error uploading logo', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      shopLogo: null,
    }));
    toast('Shop logo removed. Click "Save & Apply Settings" to commit.', 'info');
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
            Customize boutique branding, thermal receipt layouts, PDF invoices, and cashier accounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'shop'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shop & Currency</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'receipt'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Receipt & Invoice Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
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

          {/* Right Column: Live Price Sample */}
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
          </div>
        </form>
      )}

      {/* TAB 2: RECEIPT & INVOICE CUSTOMIZATION SETTINGS */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveShopSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Controls (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-6">
            {/* Section 1: Shop Logo Customization */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-bold text-stone-900 text-base font-display flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-rose-600" />
                    <span>Shop Logo & Branding</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Upload your store logo to be featured on thermal receipts and PDF invoices.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-stone-300 flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-2xs">
                  {formData.shopLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.shopLogo}
                      alt="Shop Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-stone-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}
                </div>

                {/* Upload Actions */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                      id="shop-logo-file-input"
                    />
                    <label
                      htmlFor="shop-logo-file-input"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition-all shadow-sm ${
                        isUploadingLogo ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{formData.shopLogo ? 'Change Logo Image' : 'Upload Shop Logo'}</span>
                    </label>

                    {formData.shopLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Recommended: High contrast square or horizontal PNG/JPG image (max 5MB).
                  </p>

                  {/* Toggle show logo on receipt */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="showLogoOnReceipt"
                      checked={formData.showLogoOnReceipt !== false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          showLogoOnReceipt: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500"
                    />
                    <label
                      htmlFor="showLogoOnReceipt"
                      className="text-xs font-semibold text-stone-800 cursor-pointer select-none"
                    >
                      Print Shop Logo on 80mm Thermal Receipts
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Custom Header & Footer Messages */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-sm font-display flex items-center gap-2 border-b border-stone-100 pb-2">
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Custom Receipt & Invoice Messages</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Custom Header Note / Greeting Message
                </label>
                <input
                  type="text"
                  value={formData.headerNote || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, headerNote: e.target.value }))
                  }
                  placeholder="e.g. Welcome to Tharu Gift Hub • Handcrafted with Love"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Appears below the store contact details at the top of receipts and invoices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Custom Footer Note / Thank You Message
                </label>
                <input
                  type="text"
                  value={formData.footerNote || formData.receiptFooter || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ 
                      ...prev, 
                      footerNote: e.target.value,
                      receiptFooter: e.target.value,
                    }))
                  }
                  placeholder="e.g. Thank you for shopping with us! Visit again. ✨"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Appears at the very bottom of both printable thermal rolls and PDF invoices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Exchange / Return Policy Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptNote || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, receiptNote: e.target.value }))
                  }
                  placeholder="e.g. Items in original condition can be exchanged within 14 days with this receipt."
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
                />
              </div>
            </div>

            {/* Save Action */}
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

          {/* Right Column: Live Thermal Receipt Preview (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-stone-900 rounded-3xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider font-display">
                    Thermal Receipt Live Preview
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                  80mm Roll
                </span>
              </div>

              {/* Thermal Paper Representation */}
              <div className="mt-4 bg-white text-black p-3.5 rounded-2xl shadow-inner font-mono text-[10px] leading-tight select-none">
                {/* Logo in preview */}
                {formData.showLogoOnReceipt !== false && formData.shopLogo && (
                  <div className="flex justify-center mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.shopLogo}
                      alt="Logo"
                      className="max-h-9 max-w-[40mm] object-contain filter grayscale"
                    />
                  </div>
                )}

                <div className="text-center">
                  <div className="font-bold text-xs uppercase text-stone-900">
                    {formData.shopName || 'Store Name'}
                  </div>
                  {formData.shopTagline && (
                    <div className="text-[8px] text-stone-500 italic">{formData.shopTagline}</div>
                  )}
                  <div className="text-[9px] text-stone-700">{formData.address}</div>
                  <div className="text-[9px] text-stone-700">Tel: {formData.phone}</div>
                  {formData.headerNote && (
                    <div className="text-[8.5px] font-bold text-stone-800 italic mt-0.5">
                      {formData.headerNote}
                    </div>
                  )}
                </div>

                <div className="my-1.5 text-center text-stone-400 text-[8px] tracking-tighter">
                  ------------------------------------
                </div>

                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between text-stone-600">
                    <span>RECEIPT #:</span>
                    <span className="font-bold">BB-SAMPLE-001</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Customer:</span>
                    <span className="font-semibold">Walk-in Customer</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Cashier:</span>
                    <span className="font-semibold">Emma Harrison</span>
                  </div>
                </div>

                <div className="my-1.5 text-center text-stone-400 text-[8px] tracking-tighter">
                  ------------------------------------
                </div>

                <div className="space-y-1 text-[9px]">
                  <div className="flex justify-between">
                    <span>1x Scented Candle</span>
                    <span className="font-bold">{formatMoney(18.00)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2x Greeting Card</span>
                    <span className="font-bold">{formatMoney(9.98)}</span>
                  </div>
                </div>

                <div className="my-1.5 text-center text-stone-400 text-[8px] tracking-tighter">
                  ------------------------------------
                </div>

                <div className="border-t border-b border-black py-1 my-1 flex justify-between font-bold text-xs">
                  <span>TOTAL:</span>
                  <span>{formatMoney(27.98)}</span>
                </div>

                <div className="pt-2 text-center text-[8.5px] text-stone-700 space-y-0.5">
                  <p className="font-bold">
                    {formData.footerNote || formData.receiptFooter || 'Thank you for shopping with us!'}
                  </p>
                  {formData.receiptNote && (
                    <p className="text-[7.5px] text-stone-500 italic">{formData.receiptNote}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: USER & CASHIER MANAGEMENT */}
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
