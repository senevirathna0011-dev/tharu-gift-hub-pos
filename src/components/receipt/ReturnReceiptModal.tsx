'use client';

import React, { useCallback } from 'react';
import { SalesReturn } from '@/lib/types';
import ReturnThermalReceipt from './ReturnThermalReceipt';
import { Printer, CheckCircle2, X } from 'lucide-react';

interface ReturnReceiptModalProps {
  isOpen: boolean;
  salesReturn: SalesReturn | null;
  onClose: () => void;
}

export default function ReturnReceiptModal({
  isOpen,
  salesReturn,
  onClose,
}: ReturnReceiptModalProps) {
  const handlePrint = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  }, []);

  if (!isOpen || !salesReturn) return null;

  return (
    <div className="print-receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="print-receipt-modal-card relative w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2 text-rose-600">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Return Voucher / Credit Note
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                80mm Thermal Return Voucher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="receipt-print-wrapper p-6 overflow-y-auto flex-1 flex justify-center bg-stone-100/80">
          <ReturnThermalReceipt salesReturn={salesReturn} />
        </div>

        {/* Action Buttons Footer */}
        <div className="no-print p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition-colors flex-1 font-display"
          >
            Done
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all flex-1 font-display"
          >
            <Printer className="w-4 h-4" />
            <span>Print Return Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}
