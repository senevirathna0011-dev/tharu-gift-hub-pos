'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/lib/types';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Partial<Customer>) => Promise<boolean>;
  initialCustomer?: Customer | null;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
}: CustomerFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | string>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = !!initialCustomer;

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setName(initialCustomer.name || '');
        setPhone(initialCustomer.phone || '');
        setEmail(initialCustomer.email || '');
        setAddress(initialCustomer.address || '');
        setLoyaltyPoints(initialCustomer.loyaltyPoints ?? 0);
      } else {
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setLoyaltyPoints(0);
      }
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialCustomer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Customer Name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone Number is required');
      return;
    }

    setIsSaving(true);
    const payload: Partial<Customer> = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      loyaltyPoints: parseInt(String(loyaltyPoints), 10) || 0,
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {isEdit ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEdit ? 'Update contact info and loyalty points balance' : 'Add customer to directory for POS sales and reward points'}
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

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins, David Silva"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-medium"
              />
            </div>
          </div>

          {/* Phone & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Delivery / Billing Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 120 Galle Road, Colombo 03"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500"
              />
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-800">Loyalty Reward Points</span>
                <p className="text-[11px] text-stone-500">Points earned from boutique orders</p>
              </div>
            </div>
            <div className="w-24">
              <input
                type="number"
                min="0"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-stone-300 font-mono font-bold text-sm text-right focus:border-rose-500"
              />
            </div>
          </div>

          {/* Actions */}
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
                  <span>Saving Customer...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Customer' : 'Register Customer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
