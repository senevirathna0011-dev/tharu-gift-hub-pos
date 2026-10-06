'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StoreSettings } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface SettingsContextType {
  settings: StoreSettings;
  isLoading: boolean;
  formatMoney: (amount: number | null | undefined) => string;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  shopName: 'Tharu Gift Hub',
  shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
  shopLogo: null,
  address: '452 Velvet Lane, Suite 100, West District',
  phone: '+1 (555) 839-4438',
  email: 'hello@blissandbloomgifts.com',
  currencySymbol: '$',
  currencyCode: 'USD',
  taxRate: 0.08,
  headerNote: 'Welcome to Tharu Gift Hub',
  footerNote: 'Thank you for shopping with us! Visit again. ✨',
  receiptFooter: 'Thank you for shopping with us! Visit again. ✨',
  receiptNote: 'Items in original condition can be exchanged within 14 days with receipt.',
  showLogoOnReceipt: true,
  invoicePrefix: 'TGH-',
  invoicePrimaryColor: '#E11D48',
  invoiceHeaderLayout: 'split',
  showEmailOnInvoice: true,
  showPhoneOnInvoice: true,
  showTaglineOnInvoice: true,
  showHeaderNoteOnInvoice: true,
  bankDetails: '',
  invoiceTerms: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update settings:', err);
      return false;
    }
  };

  const formatMoney = useCallback(
    (amount: number | null | undefined): string => {
      return formatCurrency(amount, settings.currencySymbol || '$');
    },
    [settings.currencySymbol]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        formatMoney,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
