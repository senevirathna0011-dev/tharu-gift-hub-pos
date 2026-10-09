'use client';

import React, { useRef, useEffect, memo } from 'react';
import { ScanLine, X } from 'lucide-react';

interface BarcodeScannerInputProps {
  value: string;
  onChange: (val: string) => void;
  onEnterScan: (term: string) => void;
  placeholder?: string;
}

const BarcodeScannerInput = memo(function BarcodeScannerInput({
  value,
  onChange,
  onEnterScan,
  placeholder = 'Scan barcode or search gift items (SKU, Name)...',
}: BarcodeScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus automatically on mount for fast cashier workflow
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onEnterScan(value.trim());
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400">
        <ScanLine className="w-5 h-5 text-pink-500" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-white rounded-xl border border-stone-200 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm placeholder:text-stone-400 font-medium transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

export default BarcodeScannerInput;
