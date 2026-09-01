'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/ui/Toast';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomerHistoryModal from '@/components/customers/CustomerHistoryModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  ShoppingBag, 
  History, 
  Edit, 
  Trash2, 
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function CustomersPage() {
  const { formatMoney } = useSettings();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingHistoryCustomer, setViewingHistoryCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      } else {
        toast(data.error || 'Failed to load customers', 'error');
      }
    } catch (err) {
      toast('Network error loading customer directory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    const debounce = setTimeout(fetchCustomers, 150);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  // Handle Save (Create or Update)
  const handleSaveCustomer = async (payload: Partial<Customer>): Promise<boolean> => {
    try {
      const isEdit = !!editingCustomer;
      const url = isEdit ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast(
          isEdit ? `Updated customer "${payload.name}"` : `Registered customer "${payload.name}"`,
          'success'
        );
        fetchCustomers();
        return true;
      } else {
        toast(data.error || 'Failed to save customer', 'error');
        return false;
      }
    } catch (err) {
      toast('Network error saving customer', 'error');
      return false;
    }
  };

  // Handle Delete
  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        toast('Customer removed from directory', 'success');
      } else {
        toast(data.error || 'Failed to delete customer', 'error');
      }
    } catch (err) {
      toast('Error deleting customer', 'error');
    }
  };

  // Summary Metrics
  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const topCustomer = [...customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Customer Directory & Loyalty</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
              {totalCustomers} Registered
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage customer records, track loyalty points, and review order histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs"
            title="Refresh Customers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25 transition-all font-display"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Customers
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {totalCustomers}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Loyalty Points
            </span>
            <div className="text-2xl font-black text-amber-600 font-display mt-0.5">
              {totalPoints.toLocaleString()} pts
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Customer Total Spend
            </span>
            <div className="text-2xl font-black text-emerald-700 font-display mt-0.5">
              {formatMoney(totalRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Top Customer
            </span>
            <div className="text-sm font-bold text-stone-900 truncate max-w-[130px] mt-0.5">
              {topCustomer ? topCustomer.name : 'N/A'}
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              {topCustomer?.totalSpent ? formatMoney(topCustomer.totalSpent) : '$0.00'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Phone (+94...), or Email..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:border-rose-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-3.5 px-4 text-center">Loyalty Points</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-700">No registered customers found</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Click "Add New Customer" above to register your first shopper.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Customer Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center font-display shrink-0 shadow-2xs">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{customer.name}</div>
                          <div className="text-[10px] text-stone-400">
                            Joined {formatDate(customer.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-stone-800 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 text-stone-600 max-w-xs">
                      {customer.address ? (
                        <div className="flex items-center gap-1 truncate text-[11px]">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300 text-[11px] italic">No address</span>
                      )}
                    </td>

                    {/* Orders Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 font-mono font-bold text-stone-700 text-[11px]">
                        <ShoppingBag className="w-3 h-3 text-stone-500" />
                        {customer.salesCount || 0}
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                      {formatMoney(customer.totalSpent || 0)}
                    </td>

                    {/* Loyalty Points */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono font-bold">
                        <Award className="w-3 h-3" />
                        {customer.loyaltyPoints} pts
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* History Button */}
                        <button
                          onClick={() => setViewingHistoryCustomer(customer)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
                          title="View purchase history"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
                          title="Edit customer details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingId(customer.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        initialCustomer={editingCustomer}
      />

      {/* Customer Purchase History Modal */}
      <CustomerHistoryModal
        isOpen={!!viewingHistoryCustomer}
        onClose={() => setViewingHistoryCustomer(null)}
        customer={viewingHistoryCustomer}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-base font-display">Delete Customer Record?</h4>
            <p className="text-xs text-stone-500 mt-1">
              Are you sure you want to delete this customer? Their past sales will remain recorded under Walk-in.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteCustomer(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
