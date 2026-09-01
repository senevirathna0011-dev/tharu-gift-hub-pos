'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/lib/types';
import { 
  X, 
  Search, 
  UserPlus, 
  User, 
  Phone, 
  Award, 
  Check, 
  Loader2 
} from 'lucide-react';

interface CustomerQuickSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomerId?: string | null;
  onOpenNewCustomerModal: () => void;
}

export default function CustomerQuickSelectModal({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
  onOpenNewCustomerModal,
}: CustomerQuickSelectModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCustomers = async () => {
        try {
          setIsLoading(true);
          const params = new URLSearchParams();
          if (searchQuery.trim()) params.set('q', searchQuery.trim());
          const res = await fetch(`/api/customers?${params.toString()}`);
          const data = await res.json();
          if (data.success) {
            setCustomers(data.customers);
          }
        } catch (err) {
          console.error('Failed to load customers', err);
        } finally {
          setIsLoading(false);
        }
      };

      const debounce = setTimeout(fetchCustomers, 150);
      return () => clearTimeout(debounce);
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm font-display">
                Select or Add Customer
              </h3>
              <p className="text-[11px] text-stone-500">Attach customer to record sale & points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Add Button */}
        <div className="p-4 border-b border-stone-100 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Phone, or Email..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Walk-in Reset button */}
            <button
              type="button"
              onClick={() => {
                onSelectCustomer(null);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
            >
              Walk-in (Anonymous)
            </button>

            {/* Quick Register New Customer */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewCustomerModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-all font-display"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Customer</span>
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="p-3 overflow-y-auto flex-1 divide-y divide-stone-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-stone-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
              <span className="text-xs">Searching customer records...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              <p className="font-semibold text-stone-700">No matching customer found</p>
              <p className="text-[11px] mt-0.5">Click "+ New Customer" above to register immediately.</p>
            </div>
          ) : (
            customers.map((c) => {
              const isSelected = selectedCustomerId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 shadow-2xs'
                      : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.loyaltyPoints > 0 && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-mono text-[9px] font-bold flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5" />
                            {c.loyaltyPoints}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{c.phone}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
