import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Tharu Gift Hub | Gift Shop POS & Stock Management',
  description: 'Modern, responsive Point of Sale and Stock Management System for gift shops, boutiques, and souvenir stores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-pink-100 selection:text-pink-900">
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
