'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import CashierSwitchModal from '@/components/auth/CashierSwitchModal';
import { 
  ShoppingBag, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  Clock, 
  Gift, 
  UserCheck, 
  ShieldCheck, 
  ChevronDown, 
  Lock, 
  Users, 
  TrendingUp, 
  KeyRound, 
  LogOut,
  User,
  Building2,
  QrCode
} from 'lucide-react';
import ShareCatalogModal from '@/components/catalog/ShareCatalogModal';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser, 
    isAdmin, 
    openSwitchModal, 
    openChangePasswordModal, 
    logout 
  } = useAuth();
  const { settings } = useSettings();

  const [time, setTime] = useState<string>('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const checkStock = async () => {
      try {
        const res = await fetch('/api/products?lowStock=true');
        const data = await res.json();
        if (data.success) {
          setLowStockCount(data.products.length);
        }
      } catch (err) {
        console.error('Failed to check stock alert count', err);
      }
    };
    checkStock();
    const stockInterval = setInterval(checkStock, 20000);
    return () => clearInterval(stockInterval);
  }, [pathname, isAdmin]);

  // If on login page or customer catalog page, don't show internal POS Navbar
  if (pathname === '/login' || pathname.startsWith('/catalog')) {
    return null;
  }

  // Navigation Links: Cashier can ONLY see POS Terminal; Admin sees all
  const navLinks = [
    { href: '/pos', label: 'POS Terminal', icon: ShoppingBag, badge: null, adminOnly: false },
    { 
      href: '/inventory', 
      label: 'Inventory', 
      icon: Package, 
      badge: lowStockCount > 0 ? `${lowStockCount}` : null,
      adminOnly: true 
    },
    { href: '/customers', label: 'Customers', icon: Users, badge: null, adminOnly: true },
    { href: '/suppliers', label: 'Suppliers', icon: Building2, badge: null, adminOnly: true },
    { href: '/sales', label: 'Sales Ledger', icon: Receipt, badge: null, adminOnly: true },
    { href: '/reports', label: 'Reports', icon: TrendingUp, badge: null, adminOnly: true },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null, adminOnly: true },
    { href: '/users', label: 'User Staff', icon: ShieldCheck, badge: null, adminOnly: true },
    { href: '/settings', label: 'Settings', icon: Settings, badge: null, adminOnly: true },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <Link href="/pos" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg text-stone-900 tracking-tight font-display truncate max-w-[170px] sm:max-w-none">
                    {settings.shopName || 'Tharu Gift Hub'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700 font-bold uppercase tracking-wider">
                    {settings.currencySymbol || '$'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 -mt-0.5 truncate max-w-[160px] sm:max-w-none">
                  {settings.shopTagline || 'Gift Boutique & POS'}
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
              {navLinks.map((link) => {
                if (link.adminOnly && !isAdmin) return null;
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href === '/pos' && pathname === '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white shadow-2xs">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Share Catalog, Clock & Active User Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Share Online Catalog Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/80 hover:border-pink-300 text-xs font-bold transition-all shadow-2xs group"
                title="Share digital catalog link & scan QR code"
              >
                <QrCode className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-display">Share Online Catalog</span>
                <span className="sm:hidden font-display">Catalog QR</span>
              </button>

              {/* Clock */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 rounded-xl border border-stone-200/70 font-mono text-[11px] text-stone-600">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{time || '--:--:--'}</span>
              </div>

              {/* Profile Dropdown Container */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 transition-all text-left group shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-stone-700 to-stone-900 text-white font-bold text-xs flex items-center justify-center font-display shadow-2xs">
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-stone-900 truncate max-w-[110px] group-hover:text-rose-600 transition-colors">
                        {currentUser?.name || 'Staff Member'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-rose-600 transition-colors" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {currentUser?.role || 'CASHIER'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">Online</span>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{currentUser?.name}</p>
                      <p className="text-[11px] text-stone-400 font-mono">@{currentUser?.username}</p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      {/* Switch Shift */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          openSwitchModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-medium transition-colors text-left"
                      >
                        <UserCheck className="w-4 h-4 text-stone-400" />
                        <span>Switch Shift (PIN)</span>
                      </button>

                      {/* Change Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          openChangePasswordModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-medium transition-colors text-left"
                      >
                        <KeyRound className="w-4 h-4 text-stone-400" />
                        <span>Change Password</span>
                      </button>

                      {isAdmin && (
                        <Link
                          href="/users"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 font-medium transition-colors text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>User Staff Management</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation Strip */}
          <div className="md:hidden flex items-center justify-around py-2 border-t border-stone-100 text-xs">
            {navLinks.map((link) => {
              if (link.adminOnly && !isAdmin) return null;
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === '/pos' && pathname === '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center py-1 px-2 rounded-lg ${
                    isActive ? 'text-rose-600 font-bold' : 'text-stone-500 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Cashier Shift Switcher PIN Modal */}
      <CashierSwitchModal />

      {/* Share Online Catalog & QR Modal */}
      <ShareCatalogModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
