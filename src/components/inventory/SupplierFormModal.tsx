'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/lib/types';
import { 
  X, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: Partial<Supplier>) => Promise<boolean>;
  initialSupplier?: Supplier | null;
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  onSave,
  initialSupplier,
}: SupplierFormModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = !!initialSupplier;

  useEffect(() => {
    if (isOpen) {
      if (initialSupplier) {
        setName(initialSupplier.name);
        setCompany(initialSupplier.company);
        setPhone(initialSupplier.phone);
        setEmail(initialSupplier.email || '');
        setAddress(initialSupplier.address || '');
        setNotes(initialSupplier.notes || '');
      } else {
        setName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
      }
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialSupplier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!company.trim()) {
      setErrorMsg('Company / Vendor name is required');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Contact person name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required');
      return;
    }

    setIsSaving(true);
    const payload: Partial<Supplier> = {
      company: company.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEdit ? 'Update supplier contact information & company details' : 'Register a vendor/supplier to link products to'}
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

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Company / Vendor Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Blossom Gifts Wholesale Ltd, Artisan Craft Supplies"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Contact Person Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jonathan Hayes, Account Representative"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* Phone & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@blossomgifts.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Physical Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suite 400, Industrial Zone, Colombo 03"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Supplier Notes / Terms (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, delivery lead times, discounts..."
                className="w-full pl-10 pr-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500"
              />
            </div>
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
                  <span>Saving Supplier...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Supplier' : 'Save Supplier'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
