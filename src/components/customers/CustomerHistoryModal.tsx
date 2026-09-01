'use client';

import React, { useState, useEffect } from 'react';
import { Customer, Sale } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';
import ReceiptModal from '@/components/receipt/ReceiptModal';
import { 
  X, 
  User, 
  ShoppingBag, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  Receipt, 
  Printer, 
  Loader2 
} from 'lucide-react';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
}: CustomerHistoryModalProps) {
  const { formatMoney } = useSettings();
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchHistory = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/customers/${customer.id}`);
          const data = await res.json();
          if (data.success && data.customer) {
            setCustomerDetails(data.customer);
          }
        } catch (err) {
          console.error('Failed to load customer history', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const currentCustomer = customerDetails || customer;
  const sales = currentCustomer.sales || [];
  const totalSpent = currentCustomer.totalSpent ?? sales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm font-display">
                {currentCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-display flex items-center gap-2">
                  <span>{currentCustomer.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1 font-mono">
                    <Award className="w-3 h-3" />
                    {currentCustomer.loyaltyPoints} Points
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-stone-400" />
                    {currentCustomer.phone}
                  </span>
                  {currentCustomer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-stone-400" />
                      {currentCustomer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 border-b border-stone-200/80 text-xs">
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-stone-500 font-medium">Total Orders</span>
              <div className="text-lg font-black text-stone-900 font-display mt-0.5">
                {sales.length}
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-stone-500 font-medium">Total Lifetime Spend</span>
              <div className="text-lg font-black text-stone-900 font-display mt-0.5">
                {formatMoney(totalSpent)}
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-stone-500 font-medium">Loyalty Balance</span>
              <div className="text-lg font-black text-amber-600 font-display mt-0.5">
                {currentCustomer.loyaltyPoints} pts
              </div>
            </div>
          </div>

          {/* Address if present */}
          {currentCustomer.address && (
            <div className="px-6 py-2 bg-stone-100/60 text-xs text-stone-600 flex items-center gap-1.5 border-b border-stone-200/50">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{currentCustomer.address}</span>
            </div>
          )}

          {/* Sales History List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Purchase History ({sales.length})
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-stone-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
                <span className="text-xs">Loading orders...</span>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-semibold text-stone-700">No purchases recorded yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Select this customer during checkout in POS to link sales.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-pink-300 hover:shadow-sm transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          {sale.receiptNo}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-stone-100 font-semibold text-stone-600">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">
                        {formatDate(sale.createdAt)}
                      </div>
                      {sale.items && sale.items.length > 0 && (
                        <div className="text-[11px] text-stone-600 line-clamp-1">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-sm font-mono text-stone-900 font-display">
                          {formatMoney(sale.totalAmount)}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                      </div>

                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-600 transition-colors shadow-2xs"
                        title="View & Print Thermal Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal if opened */}
      <ReceiptModal
        isOpen={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </>
  );
}
